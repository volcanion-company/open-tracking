-- ============================================================
-- Query Optimization for Existing Repositories
-- Performance improvements and best practices
-- ============================================================

-- ============================================================
-- 1. OPTIMIZED TRACKING EVENT QUERIES
-- ============================================================

-- Current: GetByPartnerAsync
-- Optimization: Add ORDER BY DESC for better index usage with time-series data
-- Add LIMIT for pagination
SELECT 
    id, partner_id, sub_system_id, event_time, event_type, metadata, ip, user_agent
FROM tracking_events
WHERE partner_id = $1
    AND event_time >= $2
    AND event_time <= $3
ORDER BY event_time DESC  -- Changed from ASC to DESC for better recent data access
LIMIT 1000;  -- Add pagination limit

-- Better version with pagination
SELECT 
    id, partner_id, sub_system_id, event_time, event_type, metadata, ip, user_agent
FROM tracking_events
WHERE partner_id = $1
    AND event_time >= $2
    AND event_time <= $3
ORDER BY event_time DESC
OFFSET $4 LIMIT $5;  -- Page offset and page size


-- ============================================================
-- 2. AGGREGATE QUERIES OPTIMIZATION
-- ============================================================

-- Current: GetCountByPartnerAsync
-- Optimization: Use approximate count for large datasets
-- Exact count (slow for large tables)
SELECT COUNT(*) 
FROM tracking_events
WHERE partner_id = $1
    AND event_time >= $2
    AND event_time <= $3;

-- Fast approximate count (for UI display)
SELECT reltuples::BIGINT AS estimate
FROM pg_class
WHERE relname = 'tracking_events';

-- Or use statistics
SELECT 
    SUM(CASE 
        WHEN partner_id = $1 
        AND event_time >= $2 
        AND event_time <= $3 
        THEN 1 ELSE 0 
    END) as count
FROM tracking_events TABLESAMPLE SYSTEM(1);  -- Sample 1% for estimate


-- ============================================================
-- 3. EVENT TYPE AGGREGATION
-- ============================================================

-- Current: GetEventTypeCountsAsync
-- Optimization: Add filtering by partner and use partial indexes

-- Optimized version with partner filter
SELECT 
    event_type,
    COUNT(*) as count
FROM tracking_events
WHERE partner_id = $1  -- Add partner filter
    AND sub_system_id = $2
    AND event_time >= $3
    AND event_time <= $4
GROUP BY event_type
ORDER BY count DESC;

-- For real-time dashboard (recent data only)
SELECT 
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT metadata->>'user_id') as unique_users
FROM tracking_events
WHERE partner_id = $1
    AND event_time > NOW() - INTERVAL '5 minutes'
GROUP BY event_type
ORDER BY count DESC;


-- ============================================================
-- 4. BULK INSERT OPTIMIZATION
-- ============================================================

-- Current: BulkAddAsync with AddRangeAsync
-- EF Core optimization: Use ExecuteSqlRaw for very large batches

-- Option 1: COPY command for fastest bulk insert (PostgreSQL specific)
COPY tracking_events (id, partner_id, sub_system_id, event_time, event_type, metadata, ip, user_agent)
FROM STDIN;
-- Data rows...

-- Option 2: Multi-row INSERT with batch size limit
INSERT INTO tracking_events (id, partner_id, sub_system_id, event_time, event_type, metadata, ip, user_agent)
VALUES 
    ($1, $2, $3, $4, $5, $6, $7, $8),
    ($9, $10, $11, $12, $13, $14, $15, $16),
    -- ... up to 1000 rows per batch
ON CONFLICT (id) DO NOTHING;  -- Handle duplicates gracefully


-- ============================================================
-- 5. TIME-SERIES QUERIES WITH BUCKETING
-- ============================================================

-- Hourly aggregation (for charts)
SELECT 
    DATE_TRUNC('hour', event_time) as hour,
    event_type,
    COUNT(*) as event_count
FROM tracking_events
WHERE partner_id = $1
    AND event_time >= $2
    AND event_time <= $3
GROUP BY DATE_TRUNC('hour', event_time), event_type
ORDER BY hour DESC;

-- Daily aggregation
SELECT 
    DATE(event_time) as date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'user_id') as unique_users
FROM tracking_events
WHERE partner_id = $1
    AND event_time >= $2
    AND event_time <= $3
GROUP BY DATE(event_time), event_type
ORDER BY date DESC;


-- ============================================================
-- 6. JSONB METADATA QUERIES
-- ============================================================

-- Query by JSONB field (with index support)
SELECT 
    id, event_type, event_time,
    metadata->>'user_id' as user_id,
    metadata->>'session_id' as session_id
FROM tracking_events
WHERE partner_id = $1
    AND metadata @> '{"user_id": "12345"}'::jsonb  -- Uses GIN index
    AND event_time >= $2
ORDER BY event_time DESC
LIMIT 100;

-- Top users by activity
SELECT 
    metadata->>'user_id' as user_id,
    COUNT(*) as event_count
FROM tracking_events
WHERE partner_id = $1
    AND metadata ? 'user_id'  -- Check key exists
    AND event_time >= $2
GROUP BY metadata->>'user_id'
ORDER BY event_count DESC
LIMIT 20;


-- ============================================================
-- 7. PARTNER AND SUBSYSTEM QUERIES
-- ============================================================

-- Get partner with active API keys (optimized)
SELECT 
    p.id, p.code, p.name, p.status, p.created_at,
    COUNT(DISTINCT k.id) FILTER (WHERE k.status = 'Active') as active_keys_count,
    COUNT(DISTINCT s.id) as subsystems_count
FROM partners p
LEFT JOIN partner_api_keys k ON k.partner_id = p.id
LEFT JOIN sub_systems s ON s.partner_id = p.id
WHERE p.code = $1
    AND p.status = 'Active'
GROUP BY p.id, p.code, p.name, p.status, p.created_at;

-- Get subsystem by code (with caching)
-- Add LIMIT 1 for single result queries
SELECT 
    id, partner_id, code, name, status, created_at
FROM sub_systems
WHERE partner_id = $1
    AND code = $2
    AND status = 'Active'
LIMIT 1;  -- Ensure single result


-- ============================================================
-- 8. API KEY VALIDATION OPTIMIZATION
-- ============================================================

-- Current: GetAllActiveAsync
-- Optimization: Add expiration check in WHERE clause

SELECT 
    id, partner_id, api_key_hash, status, expired_at, created_at
FROM partner_api_keys
WHERE status = 'Active'
    AND (expired_at IS NULL OR expired_at > NOW())  -- Filter expired keys
ORDER BY created_at DESC;

-- For specific partner (when partner_id is known)
SELECT 
    id, partner_id, api_key_hash, status, expired_at, created_at
FROM partner_api_keys
WHERE partner_id = $1
    AND status = 'Active'
    AND (expired_at IS NULL OR expired_at > NOW())
ORDER BY created_at DESC;


-- ============================================================
-- 9. REPORTING QUERIES WITH WINDOW FUNCTIONS
-- ============================================================

-- Event trends with moving average
SELECT 
    DATE(event_time) as date,
    COUNT(*) as daily_count,
    AVG(COUNT(*)) OVER (
        ORDER BY DATE(event_time) 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7days
FROM tracking_events
WHERE partner_id = $1
    AND event_time >= $2
GROUP BY DATE(event_time)
ORDER BY date DESC;

-- Rank subsystems by activity
SELECT 
    s.name,
    COUNT(e.id) as event_count,
    RANK() OVER (ORDER BY COUNT(e.id) DESC) as rank
FROM sub_systems s
LEFT JOIN tracking_events e ON e.sub_system_id = s.id
    AND e.event_time >= $1
WHERE s.partner_id = $2
GROUP BY s.id, s.name
ORDER BY event_count DESC;


-- ============================================================
-- 10. QUERY EXECUTION PLAN ANALYSIS
-- ============================================================

-- Check query performance
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    event_type,
    COUNT(*) as count
FROM tracking_events
WHERE partner_id = '11111111-1111-1111-1111-111111111111'
    AND event_time >= NOW() - INTERVAL '7 days'
GROUP BY event_type;

-- Expected output should show:
-- - Index Scan on idx_tracking_events_partner_time
-- - No Sequential Scan
-- - Execution time < 100ms


-- ============================================================
-- 11. RECOMMENDED EF CORE OPTIMIZATIONS
-- ============================================================

-- Use AsNoTracking() for read-only queries
-- Use AsSplitQuery() for complex includes
-- Use FromSqlRaw() for complex queries
-- Use ExecuteUpdateAsync() for bulk updates (EF Core 7+)
-- Use ExecuteDeleteAsync() for bulk deletes (EF Core 7+)

-- Example: Bulk update in EF Core
-- UPDATE tracking_events
-- SET metadata = metadata || '{"processed": true}'::jsonb
-- WHERE partner_id = $1
--     AND event_time < NOW() - INTERVAL '30 days'
--     AND NOT (metadata ? 'processed');


-- ============================================================
-- 12. CACHING STRATEGY
-- ============================================================

-- Cache these queries in Redis with appropriate TTL:
-- 1. Partner by code: TTL = 10 minutes
-- 2. Subsystem by code: TTL = 10 minutes
-- 3. Active API keys: TTL = 5 minutes
-- 4. Daily aggregations: TTL = 1 hour
-- 5. Event type counts: TTL = 5 minutes

-- Cache key patterns:
-- - partner:code:{code}
-- - subsystem:{partner_id}:{code}
-- - apikeys:active
-- - stats:daily:{partner_id}:{date}
-- - stats:events:{partner_id}:{date}
