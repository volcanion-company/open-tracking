# Database Optimization Guide

Comprehensive guide for optimizing Volcanion Tracking database performance.

## Overview

This guide covers:
1. **Indexes** - Recommended indexes for query performance
2. **Partitioning** - Table partitioning strategy for scalability
3. **Query Optimization** - Best practices for efficient queries
4. **JSONB Reporting** - Advanced queries for metadata analytics

## Quick Start

### Apply Recommended Indexes

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d volcanion_tracking

# Apply indexes
\i database/apply-indexes.sql
```

### Verify Performance

```sql
-- Check index usage
SELECT * FROM v_index_usage;

-- Check table sizes
SELECT * FROM v_table_sizes;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM tracking_events 
WHERE partner_id = '...' AND event_time > NOW() - INTERVAL '7 days';
```

## 1. Index Strategy

### Already Implemented (via EF Core)

- ✅ B-tree composite index: `(partner_id, event_time)`
- ✅ B-tree composite index: `(sub_system_id, event_time)`
- ✅ GIN index: `metadata` (JSONB)

### Recommended Additional Indexes

#### Event Type Filtering
```sql
CREATE INDEX idx_tracking_events_event_type ON tracking_events(event_type);
```
**Use case:** Filter events by type in analytics

#### Multi-column Analytics
```sql
CREATE INDEX idx_tracking_events_partner_type_time 
ON tracking_events(partner_id, event_type, event_time DESC);
```
**Use case:** Partner-specific event type analysis

#### Recent Events (Partial Index)
```sql
CREATE INDEX idx_tracking_events_recent 
ON tracking_events(partner_id, event_time DESC)
WHERE event_time > NOW() - INTERVAL '30 days';
```
**Use case:** Fast queries on hot data (smaller index size)

#### JSONB Field Indexes
```sql
-- User ID extraction
CREATE INDEX idx_tracking_events_metadata_user_id 
ON tracking_events((metadata->>'user_id'))
WHERE metadata ? 'user_id';

-- Session ID extraction
CREATE INDEX idx_tracking_events_metadata_session_id 
ON tracking_events((metadata->>'session_id'))
WHERE metadata ? 'session_id';
```
**Use case:** Direct queries on JSONB fields

### Index Maintenance

```sql
-- Rebuild indexes
REINDEX TABLE tracking_events;

-- Update statistics
ANALYZE tracking_events;

-- Monitor index usage
SELECT * FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan;
```

## 2. Table Partitioning

### Why Partition?

- ✅ Improved query performance (query only relevant partitions)
- ✅ Easier data management (archive/delete old partitions)
- ✅ Better maintenance (vacuum smaller partitions)
- ✅ Scalability (handle billions of rows)

### Partitioning Strategy

**Time-based partitioning by month** for `tracking_events`:

```sql
-- Partition table structure
CREATE TABLE tracking_events (
    id UUID,
    partner_id UUID,
    event_time TIMESTAMP,
    ...
    PRIMARY KEY (id, event_time)
) PARTITION BY RANGE (event_time);

-- Monthly partitions
CREATE TABLE tracking_events_2025_12 PARTITION OF tracking_events
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE tracking_events_2026_01 PARTITION OF tracking_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### Automated Partition Management

```sql
-- Create function to auto-create partitions
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
BEGIN
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'tracking_events_' || TO_CHAR(partition_date, 'YYYY_MM');
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF tracking_events FOR VALUES FROM (%L) TO (%L)',
            partition_name, 
            TO_CHAR(partition_date, 'YYYY-MM-DD'),
            TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD')
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron
SELECT cron.schedule('create-partitions', '0 0 1 * *', 'SELECT create_monthly_partition()');
```

### Old Data Archival

```sql
-- Archive partitions older than 12 months
CREATE OR REPLACE FUNCTION archive_old_partitions(months_to_keep INTEGER DEFAULT 12)
RETURNS void AS $$
BEGIN
    -- Move to archive schema or drop
    FOR partition_record IN 
        SELECT tablename FROM pg_tables 
        WHERE tablename LIKE 'tracking_events_20%'
    LOOP
        -- Archive or drop
        EXECUTE format('ALTER TABLE %I SET SCHEMA archive', partition_record.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## 3. Query Optimization

### EF Core Best Practices

#### Use AsNoTracking() for Read-Only Queries

```csharp
// ❌ Bad - Tracks entities unnecessarily
var events = await dbContext.TrackingEvents
    .Where(e => e.PartnerId == partnerId)
    .ToListAsync();

// ✅ Good - No tracking overhead
var events = await dbContext.TrackingEvents
    .AsNoTracking()
    .Where(e => e.PartnerId == partnerId)
    .ToListAsync();
```

#### Use AsSplitQuery() for Multiple Includes

```csharp
// ❌ Bad - Cartesian explosion with Include
var partner = await dbContext.Partners
    .Include(p => p.ApiKeys)
    .Include(p => p.SubSystems)
    .FirstOrDefaultAsync(p => p.Id == id);

// ✅ Good - Separate queries for each navigation
var partner = await dbContext.Partners
    .AsNoTracking()
    .AsSplitQuery()
    .Include(p => p.ApiKeys)
    .Include(p => p.SubSystems)
    .FirstOrDefaultAsync(p => p.Id == id);
```

#### Filter Related Data in Include

```csharp
// ❌ Bad - Loads all API keys
.Include(p => p.ApiKeys)

// ✅ Good - Only active keys
.Include(p => p.ApiKeys.Where(k => k.Status == "Active"))
```

#### Limit Large Result Sets

```csharp
// ❌ Bad - No limit
var events = await dbContext.TrackingEvents
    .Where(e => e.PartnerId == partnerId)
    .ToListAsync();

// ✅ Good - With pagination
var events = await dbContext.TrackingEvents
    .AsNoTracking()
    .Where(e => e.PartnerId == partnerId)
    .OrderByDescending(e => e.EventTime)
    .Take(10000)
    .ToListAsync();
```

### SQL Query Patterns

#### Time-Series Queries

```sql
-- Use DESC ordering for recent data (better index usage)
SELECT * FROM tracking_events
WHERE partner_id = $1
    AND event_time >= $2
ORDER BY event_time DESC  -- Not ASC
LIMIT 1000;
```

#### Aggregations with Bucketing

```sql
-- Hourly aggregation
SELECT 
    DATE_TRUNC('hour', event_time) as hour,
    event_type,
    COUNT(*) as count
FROM tracking_events
WHERE partner_id = $1
    AND event_time >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', event_time), event_type;
```

#### Approximate Counts for Large Tables

```sql
-- ❌ Slow for billions of rows
SELECT COUNT(*) FROM tracking_events;

-- ✅ Fast estimate
SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'tracking_events';
```

## 4. JSONB Metadata Queries

### Basic JSONB Operations

```sql
-- Check key exists
WHERE metadata ? 'user_id'

-- Extract value
SELECT metadata->>'user_id' as user_id

-- Contains specific JSON
WHERE metadata @> '{"event_type": "purchase"}'::jsonb

-- Nested field access
SELECT metadata->'customer'->>'email' as email
```

### Top 10 Report Patterns

#### 1. Top Users by Activity
```sql
SELECT 
    metadata->>'user_id' as user_id,
    COUNT(*) as event_count
FROM tracking_events
WHERE metadata ? 'user_id'
    AND event_time > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'user_id'
ORDER BY event_count DESC
LIMIT 20;
```

#### 2. Page Performance Metrics
```sql
SELECT 
    metadata->>'page_url' as page,
    COUNT(*) as samples,
    ROUND(AVG((metadata->>'duration_ms')::NUMERIC), 2) as avg_load_time,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::NUMERIC), 2) as p95
FROM tracking_events
WHERE metadata ? 'duration_ms'
GROUP BY metadata->>'page_url'
ORDER BY avg_load_time DESC;
```

#### 3. Funnel Analysis
```sql
WITH funnel AS (
    SELECT 
        metadata->>'session_id' as session_id,
        MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as step1,
        MAX(CASE WHEN event_type = 'cart_add' THEN 1 ELSE 0 END) as step2,
        MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as step3
    FROM tracking_events
    WHERE metadata ? 'session_id'
    GROUP BY metadata->>'session_id'
)
SELECT 
    SUM(step1) as reached_step1,
    SUM(step2) as reached_step2,
    SUM(step3) as reached_step3,
    ROUND(SUM(step2)::NUMERIC / NULLIF(SUM(step1), 0) * 100, 2) as conversion_1_to_2
FROM funnel;
```

#### 4. User Session Analysis
```sql
SELECT 
    metadata->>'session_id' as session_id,
    MIN(event_time) as session_start,
    MAX(event_time) as session_end,
    EXTRACT(EPOCH FROM (MAX(event_time) - MIN(event_time))) as duration_seconds,
    COUNT(*) as total_events
FROM tracking_events
WHERE metadata ? 'session_id'
    AND event_time > NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'session_id'
ORDER BY duration_seconds DESC;
```

#### 5. Revenue Analytics
```sql
SELECT 
    DATE(event_time) as date,
    COUNT(*) as total_purchases,
    SUM((metadata->>'amount')::NUMERIC) as total_revenue,
    AVG((metadata->>'amount')::NUMERIC) as avg_order_value
FROM tracking_events
WHERE event_type = 'purchase'
    AND metadata ? 'amount'
    AND event_time > NOW() - INTERVAL '30 days'
GROUP BY DATE(event_time)
ORDER BY date DESC;
```

See [jsonb-query-examples.sql](jsonb-query-examples.sql) for 10+ more examples.

## 5. Materialized Views

### Create for Heavy Queries

```sql
CREATE MATERIALIZED VIEW mv_daily_event_stats AS
SELECT 
    DATE(event_time) as date,
    partner_id,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'user_id') as unique_users
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '90 days'
GROUP BY DATE(event_time), partner_id, event_type;

CREATE UNIQUE INDEX ON mv_daily_event_stats(date, partner_id, event_type);
```

### Refresh Strategy

```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_event_stats;

-- Schedule with pg_cron (daily at 2 AM)
SELECT cron.schedule('refresh-stats', '0 2 * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_event_stats');
```

## 6. Monitoring & Maintenance

### Check Index Usage

```sql
SELECT * FROM v_index_usage ORDER BY idx_scan;
```

### Check Table Sizes

```sql
SELECT * FROM v_table_sizes;
```

### Slow Query Analysis

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check slow queries
SELECT * FROM v_slow_queries;
```

### Vacuum and Analyze

```sql
-- Manual vacuum
VACUUM ANALYZE tracking_events;

-- Configure autovacuum
ALTER TABLE tracking_events SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);
```

## 7. Performance Targets

### Query Performance Goals

| Query Type | Target | Acceptable |
|------------|--------|------------|
| Point lookup (by ID) | < 10ms | < 50ms |
| Time range (7 days) | < 100ms | < 500ms |
| Aggregation (daily) | < 200ms | < 1s |
| Complex report | < 1s | < 5s |

### Scaling Targets

| Metric | Current | Target |
|--------|---------|--------|
| Events/second | 1,000 | 10,000 |
| Total events | 10M | 1B |
| Query concurrency | 100 | 1,000 |
| P95 latency | 100ms | 50ms |

## 8. Troubleshooting

### Slow Queries

```sql
-- Check query plan
EXPLAIN ANALYZE <your-query>;

-- Look for:
-- ❌ Sequential Scan (bad for large tables)
-- ✅ Index Scan (good)
-- ✅ Bitmap Heap Scan (good for range queries)
```

### Index Not Used

```sql
-- Check statistics
ANALYZE tracking_events;

-- Increase statistics target
ALTER TABLE tracking_events ALTER COLUMN partner_id SET STATISTICS 1000;
```

### Memory Issues

```sql
-- Check work_mem
SHOW work_mem;

-- Increase for complex queries
SET work_mem = '64MB';
```

## Files Reference

- [`optimization-recommendations.sql`](optimization-recommendations.sql) - Full optimization guide
- [`apply-indexes.sql`](apply-indexes.sql) - Quick index setup
- [`query-optimization.sql`](query-optimization.sql) - Query patterns
- [`jsonb-query-examples.sql`](jsonb-query-examples.sql) - 20+ report examples

## Next Steps

1. ✅ Apply recommended indexes: `psql -f database/apply-indexes.sql`
2. ✅ Test query performance with EXPLAIN ANALYZE
3. ✅ Monitor index usage over 1 week
4. ⏳ Consider partitioning when > 50M rows
5. ⏳ Setup pg_cron for automated maintenance
6. ⏳ Configure monitoring with pg_stat_statements
