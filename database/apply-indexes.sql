-- ============================================================
-- Apply Recommended Indexes
-- Run this after initial migration
-- ============================================================

-- Enable timing
\timing

-- Start transaction
BEGIN;

-- ============================================================
-- 1. TRACKING EVENTS INDEXES
-- ============================================================

-- Event type index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_event_type 
ON tracking_events(event_type);

-- Partner + event_type + time (for filtered analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_partner_type_time 
ON tracking_events(partner_id, event_type, event_time DESC);

-- Subsystem + event_type queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_subsystem_type 
ON tracking_events(sub_system_id, event_type, event_time DESC);

-- Recent events partial index (hot data)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_recent 
ON tracking_events(partner_id, event_time DESC)
WHERE event_time > NOW() - INTERVAL '30 days';

-- IP-based analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_ip 
ON tracking_events(ip) 
WHERE ip IS NOT NULL;

-- User agent analysis (hash index for equality)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_user_agent 
ON tracking_events USING hash(user_agent);

-- JSONB path ops for faster containment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_metadata_path_ops 
ON tracking_events USING gin(metadata jsonb_path_ops);

-- Specific JSONB fields (user_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_metadata_user_id 
ON tracking_events((metadata->>'user_id'))
WHERE metadata ? 'user_id';

-- Specific JSONB fields (session_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_metadata_session_id 
ON tracking_events((metadata->>'session_id'))
WHERE metadata ? 'session_id';

-- Composite index for partner + user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_partner_metadata_user 
ON tracking_events(partner_id, (metadata->>'user_id'), event_time DESC)
WHERE metadata ? 'user_id';

-- ============================================================
-- 2. PARTNERS INDEXES
-- ============================================================

-- Active partners only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_status 
ON partners(status) 
WHERE status = 'Active';

-- Case-insensitive code lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_code_lower 
ON partners(LOWER(code));

-- ============================================================
-- 3. SUB_SYSTEMS INDEXES
-- ============================================================

-- Partner + status composite
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sub_systems_partner_status 
ON sub_systems(partner_id, status);

-- Partner + code lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sub_systems_code 
ON sub_systems(partner_id, code);

-- ============================================================
-- 4. PARTNER_API_KEYS INDEXES
-- ============================================================

-- Active keys with expiration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partner_api_keys_status 
ON partner_api_keys(status, expired_at) 
WHERE status = 'Active';

-- Partner's active keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partner_api_keys_partner_active 
ON partner_api_keys(partner_id) 
WHERE status = 'Active' AND (expired_at IS NULL OR expired_at > NOW());

COMMIT;

-- ============================================================
-- 5. ANALYZE TABLES
-- ============================================================

ANALYZE tracking_events;
ANALYZE partners;
ANALYZE sub_systems;
ANALYZE partner_api_keys;

-- ============================================================
-- 6. VERIFY INDEX CREATION
-- ============================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage after some queries
-- SELECT * FROM v_index_usage;

\echo 'Indexes created successfully!'
