-- ============================================================
-- Database Optimization Recommendations
-- Volcanion Tracking - PostgreSQL 16
-- ============================================================

-- ============================================================
-- 1. INDEXES RECOMMENDATIONS
-- ============================================================

-- Already implemented in EF Core migrations:
-- - B-tree composite indexes on (partner_id, event_time)
-- - B-tree composite indexes on (sub_system_id, event_time)
-- - GIN index on metadata JSONB column

-- Additional recommended indexes for query optimization:

-- Index for filtering by event_type (frequently used in analytics)
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type 
ON tracking_events(event_type);

-- Index for filtering by multiple columns (partner + event_type + time)
CREATE INDEX IF NOT EXISTS idx_tracking_events_partner_type_time 
ON tracking_events(partner_id, event_type, event_time DESC);

-- Index for subsystem + event_type queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_subsystem_type 
ON tracking_events(sub_system_id, event_type, event_time DESC);

-- Partial index for recent events (last 30 days) - faster queries on hot data
CREATE INDEX IF NOT EXISTS idx_tracking_events_recent 
ON tracking_events(partner_id, event_time DESC)
WHERE event_time > NOW() - INTERVAL '30 days';

-- Index for IP-based analytics
CREATE INDEX IF NOT EXISTS idx_tracking_events_ip 
ON tracking_events(ip) 
WHERE ip IS NOT NULL;

-- Index for user agent analysis
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_agent 
ON tracking_events USING hash(user_agent);

-- JSONB-specific indexes for common metadata queries
-- GIN index with jsonb_path_ops for faster containment queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_metadata_path_ops 
ON tracking_events USING gin(metadata jsonb_path_ops);

-- Specific JSONB field indexes (example: user_id in metadata)
CREATE INDEX IF NOT EXISTS idx_tracking_events_metadata_user_id 
ON tracking_events((metadata->>'user_id'))
WHERE metadata ? 'user_id';

-- Specific JSONB field indexes (example: session_id in metadata)
CREATE INDEX IF NOT EXISTS idx_tracking_events_metadata_session_id 
ON tracking_events((metadata->>'session_id'))
WHERE metadata ? 'session_id';

-- Composite index for partner + JSONB field queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_partner_metadata_user 
ON tracking_events(partner_id, (metadata->>'user_id'), event_time DESC)
WHERE metadata ? 'user_id';

-- Partner tables indexes
CREATE INDEX IF NOT EXISTS idx_partners_status 
ON partners(status) 
WHERE status = 'Active';

CREATE INDEX IF NOT EXISTS idx_partners_code_lower 
ON partners(LOWER(code));

-- SubSystems indexes
CREATE INDEX IF NOT EXISTS idx_sub_systems_partner_status 
ON sub_systems(partner_id, status);

CREATE INDEX IF NOT EXISTS idx_sub_systems_code 
ON sub_systems(partner_id, code);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_status 
ON partner_api_keys(status, expired_at) 
WHERE status = 'Active';

CREATE INDEX IF NOT EXISTS idx_partner_api_keys_partner_active 
ON partner_api_keys(partner_id) 
WHERE status = 'Active' AND (expired_at IS NULL OR expired_at > NOW());


-- ============================================================
-- 2. TABLE PARTITIONING STRATEGY
-- ============================================================

-- Partition tracking_events by month (time-based partitioning)
-- This improves query performance and makes data management easier

-- Step 1: Create partitioned table (if migrating from existing table)
-- NOTE: This requires recreating the table and migrating data

/*
-- Backup existing data first
CREATE TABLE tracking_events_backup AS SELECT * FROM tracking_events;

-- Drop existing table
DROP TABLE tracking_events CASCADE;

-- Create partitioned table
CREATE TABLE tracking_events (
    id UUID DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL,
    sub_system_id UUID NOT NULL,
    event_time TIMESTAMP NOT NULL DEFAULT NOW(),
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    ip VARCHAR(45),
    user_agent TEXT,
    PRIMARY KEY (id, event_time)
) PARTITION BY RANGE (event_time);

-- Create partitions for each month
-- Current month
CREATE TABLE tracking_events_2025_12 PARTITION OF tracking_events
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Next months
CREATE TABLE tracking_events_2026_01 PARTITION OF tracking_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE tracking_events_2026_02 PARTITION OF tracking_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Create default partition for future data
CREATE TABLE tracking_events_default PARTITION OF tracking_events DEFAULT;

-- Restore data
INSERT INTO tracking_events SELECT * FROM tracking_events_backup;

-- Drop backup
DROP TABLE tracking_events_backup;
*/

-- Step 2: Automated partition management function
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    -- Create partition for next month
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'tracking_events_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := TO_CHAR(partition_date, 'YYYY-MM-DD');
    end_date := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
    
    -- Check if partition already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF tracking_events FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        
        RAISE NOTICE 'Created partition: %', partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Schedule partition creation (run monthly via cron or pg_cron)
-- Using pg_cron extension:
/*
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule partition creation on 1st of each month
SELECT cron.schedule('create-partitions', '0 0 1 * *', 'SELECT create_monthly_partition()');
*/

-- Step 4: Automated old partition archival/deletion
CREATE OR REPLACE FUNCTION archive_old_partitions(months_to_keep INTEGER DEFAULT 12)
RETURNS void AS $$
DECLARE
    partition_record RECORD;
    partition_date DATE;
    cutoff_date DATE;
BEGIN
    cutoff_date := DATE_TRUNC('month', NOW()) - (months_to_keep || ' months')::INTERVAL;
    
    FOR partition_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'tracking_events_20%'
        ORDER BY tablename
    LOOP
        -- Extract date from partition name (e.g., tracking_events_2025_12)
        partition_date := TO_DATE(
            SUBSTRING(partition_record.tablename FROM '\d{4}_\d{2}'), 
            'YYYY_MM'
        );
        
        IF partition_date < cutoff_date THEN
            -- Archive to separate schema or external storage
            EXECUTE format('ALTER TABLE %I SET SCHEMA archive', partition_record.tablename);
            
            -- Or drop if archival is not needed
            -- EXECUTE format('DROP TABLE %I', partition_record.tablename);
            
            RAISE NOTICE 'Archived partition: %', partition_record.tablename;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create archive schema
CREATE SCHEMA IF NOT EXISTS archive;


-- ============================================================
-- 3. QUERY OPTIMIZATION TECHNIQUES
-- ============================================================

-- Use EXPLAIN ANALYZE to check query plans
-- Example:
-- EXPLAIN ANALYZE SELECT * FROM tracking_events WHERE partner_id = '...' AND event_time > NOW() - INTERVAL '7 days';

-- Enable query statistics
ALTER DATABASE volcanion_tracking SET track_activities = on;
ALTER DATABASE volcanion_tracking SET track_counts = on;
ALTER DATABASE volcanion_tracking SET track_io_timing = on;

-- Create statistics for better query planning
CREATE STATISTICS IF NOT EXISTS tracking_events_partner_time_stats 
ON partner_id, event_time FROM tracking_events;

CREATE STATISTICS IF NOT EXISTS tracking_events_subsystem_type_stats 
ON sub_system_id, event_type FROM tracking_events;


-- ============================================================
-- 4. VACUUM AND MAINTENANCE
-- ============================================================

-- Autovacuum settings for high-write tables
ALTER TABLE tracking_events SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02,
    autovacuum_vacuum_cost_delay = 10
);

-- Increase statistics target for frequently queried columns
ALTER TABLE tracking_events ALTER COLUMN partner_id SET STATISTICS 1000;
ALTER TABLE tracking_events ALTER COLUMN event_time SET STATISTICS 1000;
ALTER TABLE tracking_events ALTER COLUMN event_type SET STATISTICS 500;


-- ============================================================
-- 5. MONITORING QUERIES
-- ============================================================

-- Check index usage
CREATE OR REPLACE VIEW v_index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Check table sizes
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 20;


-- ============================================================
-- 6. RECOMMENDED CONFIGURATION (postgresql.conf)
-- ============================================================

/*
# Memory Settings
shared_buffers = 4GB                  # 25% of RAM
effective_cache_size = 12GB           # 75% of RAM
work_mem = 64MB                       # Per query operation
maintenance_work_mem = 1GB            # For VACUUM, CREATE INDEX

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
max_wal_size = 4GB
min_wal_size = 1GB

# Query Planner
random_page_cost = 1.1               # For SSD
effective_io_concurrency = 200       # For SSD

# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 10s

# Logging (for debugging)
log_min_duration_statement = 1000    # Log queries slower than 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
*/


-- ============================================================
-- 7. APPLY RECOMMENDATIONS
-- ============================================================

-- Run this script to apply all recommended indexes
-- Monitor performance with the provided views
-- Consider partitioning for tables with > 10M rows
