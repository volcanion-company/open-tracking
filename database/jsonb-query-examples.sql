-- ============================================================
-- JSONB Metadata Query Examples for Reporting
-- PostgreSQL JSONB Advanced Queries
-- ============================================================

-- ============================================================
-- 1. BASIC JSONB QUERIES
-- ============================================================

-- Get events where metadata contains specific key
SELECT 
    id,
    event_type,
    event_time,
    metadata
FROM tracking_events
WHERE metadata ? 'user_id'
LIMIT 10;

-- Get events where metadata contains specific value
SELECT 
    id,
    event_type,
    metadata->>'user_id' as user_id,
    metadata->>'page_url' as page_url
FROM tracking_events
WHERE metadata @> '{"event_type": "purchase"}'
LIMIT 10;

-- Extract specific JSONB fields
SELECT 
    event_type,
    metadata->>'user_id' as user_id,
    metadata->>'session_id' as session_id,
    metadata->>'page_url' as page_url,
    (metadata->>'duration_ms')::INTEGER as duration_ms
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '24 hours'
LIMIT 100;


-- ============================================================
-- 2. AGGREGATION REPORTS
-- ============================================================

-- Report 1: Top users by event count
SELECT 
    metadata->>'user_id' as user_id,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'session_id') as session_count,
    MAX(event_time) as last_activity
FROM tracking_events
WHERE metadata ? 'user_id'
    AND event_time > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'user_id'
ORDER BY event_count DESC
LIMIT 20;

-- Report 2: Page views by URL
SELECT 
    metadata->>'page_url' as page_url,
    COUNT(*) as view_count,
    COUNT(DISTINCT metadata->>'user_id') as unique_users,
    AVG((metadata->>'duration_ms')::NUMERIC) as avg_duration_ms
FROM tracking_events
WHERE event_type = 'page_view'
    AND metadata ? 'page_url'
    AND event_time > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'page_url'
ORDER BY view_count DESC
LIMIT 50;

-- Report 3: Event funnel analysis
WITH funnel_events AS (
    SELECT 
        metadata->>'session_id' as session_id,
        MAX(CASE WHEN event_type = 'page_view' AND metadata->>'page_url' = '/home' THEN 1 ELSE 0 END) as step1_home,
        MAX(CASE WHEN event_type = 'page_view' AND metadata->>'page_url' = '/products' THEN 1 ELSE 0 END) as step2_products,
        MAX(CASE WHEN event_type = 'cart_add' THEN 1 ELSE 0 END) as step3_add_cart,
        MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as step4_purchase
    FROM tracking_events
    WHERE metadata ? 'session_id'
        AND event_time > NOW() - INTERVAL '7 days'
    GROUP BY metadata->>'session_id'
)
SELECT 
    COUNT(*) as total_sessions,
    SUM(step1_home) as reached_home,
    SUM(step2_products) as reached_products,
    SUM(step3_add_cart) as reached_cart,
    SUM(step4_purchase) as reached_purchase,
    ROUND(SUM(step2_products)::NUMERIC / NULLIF(SUM(step1_home), 0) * 100, 2) as home_to_products_rate,
    ROUND(SUM(step3_add_cart)::NUMERIC / NULLIF(SUM(step2_products), 0) * 100, 2) as products_to_cart_rate,
    ROUND(SUM(step4_purchase)::NUMERIC / NULLIF(SUM(step3_add_cart), 0) * 100, 2) as cart_to_purchase_rate
FROM funnel_events;

-- Report 4: User session duration and engagement
SELECT 
    metadata->>'session_id' as session_id,
    metadata->>'user_id' as user_id,
    MIN(event_time) as session_start,
    MAX(event_time) as session_end,
    EXTRACT(EPOCH FROM (MAX(event_time) - MIN(event_time))) as session_duration_seconds,
    COUNT(*) as total_events,
    COUNT(DISTINCT metadata->>'page_url') as unique_pages_viewed
FROM tracking_events
WHERE metadata ? 'session_id'
    AND event_time > NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'session_id', metadata->>'user_id'
HAVING COUNT(*) > 1
ORDER BY session_duration_seconds DESC
LIMIT 100;


-- ============================================================
-- 3. E-COMMERCE SPECIFIC REPORTS
-- ============================================================

-- Report 5: Product performance
SELECT 
    metadata->'items'->0->>'product' as product_name,
    COUNT(*) as purchase_count,
    SUM((metadata->>'amount')::NUMERIC) as total_revenue,
    AVG((metadata->>'amount')::NUMERIC) as avg_order_value,
    COUNT(DISTINCT metadata->>'user_id') as unique_customers
FROM tracking_events
WHERE event_type = 'purchase'
    AND metadata ? 'items'
    AND event_time > NOW() - INTERVAL '30 days'
GROUP BY metadata->'items'->0->>'product'
ORDER BY total_revenue DESC;

-- Report 6: Abandoned cart analysis
WITH cart_events AS (
    SELECT 
        metadata->>'user_id' as user_id,
        metadata->>'session_id' as session_id,
        MAX(CASE WHEN event_type = 'cart_add' THEN event_time END) as last_cart_add,
        MAX(CASE WHEN event_type = 'purchase' THEN event_time END) as purchase_time
    FROM tracking_events
    WHERE metadata ? 'session_id'
        AND event_time > NOW() - INTERVAL '7 days'
    GROUP BY metadata->>'user_id', metadata->>'session_id'
)
SELECT 
    COUNT(*) as total_carts,
    COUNT(CASE WHEN purchase_time IS NULL THEN 1 END) as abandoned_carts,
    COUNT(CASE WHEN purchase_time IS NOT NULL THEN 1 END) as completed_purchases,
    ROUND(COUNT(CASE WHEN purchase_time IS NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as abandonment_rate
FROM cart_events
WHERE last_cart_add IS NOT NULL;

-- Report 7: Customer lifetime value
SELECT 
    metadata->>'user_id' as user_id,
    COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as total_purchases,
    SUM((metadata->>'amount')::NUMERIC) as total_spent,
    MIN(event_time) FILTER (WHERE event_type = 'purchase') as first_purchase,
    MAX(event_time) FILTER (WHERE event_type = 'purchase') as last_purchase,
    AVG((metadata->>'amount')::NUMERIC) as avg_order_value
FROM tracking_events
WHERE metadata ? 'user_id'
GROUP BY metadata->>'user_id'
HAVING COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) > 0
ORDER BY total_spent DESC
LIMIT 50;


-- ============================================================
-- 4. TIME-BASED ANALYTICS
-- ============================================================

-- Report 8: Hourly event distribution
SELECT 
    EXTRACT(HOUR FROM event_time) as hour_of_day,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'user_id') as unique_users
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '7 days'
    AND metadata ? 'user_id'
GROUP BY EXTRACT(HOUR FROM event_time)
ORDER BY hour_of_day;

-- Report 9: Daily active users (DAU)
SELECT 
    DATE(event_time) as date,
    COUNT(DISTINCT metadata->>'user_id') as daily_active_users,
    COUNT(*) as total_events,
    COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN metadata->>'user_id' END) as purchasing_users
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '30 days'
    AND metadata ? 'user_id'
GROUP BY DATE(event_time)
ORDER BY date DESC;

-- Report 10: Week over week growth
WITH weekly_stats AS (
    SELECT 
        DATE_TRUNC('week', event_time) as week,
        COUNT(DISTINCT metadata->>'user_id') as unique_users,
        COUNT(*) as total_events
    FROM tracking_events
    WHERE event_time > NOW() - INTERVAL '12 weeks'
        AND metadata ? 'user_id'
    GROUP BY DATE_TRUNC('week', event_time)
)
SELECT 
    week,
    unique_users,
    total_events,
    LAG(unique_users) OVER (ORDER BY week) as previous_week_users,
    ROUND((unique_users - LAG(unique_users) OVER (ORDER BY week))::NUMERIC / 
          NULLIF(LAG(unique_users) OVER (ORDER BY week), 0) * 100, 2) as user_growth_percent
FROM weekly_stats
ORDER BY week DESC;


-- ============================================================
-- 5. USER BEHAVIOR ANALYSIS
-- ============================================================

-- Report 11: User engagement cohorts
WITH user_cohorts AS (
    SELECT 
        metadata->>'user_id' as user_id,
        DATE_TRUNC('month', MIN(event_time)) as cohort_month,
        DATE_TRUNC('month', event_time) as event_month
    FROM tracking_events
    WHERE metadata ? 'user_id'
    GROUP BY metadata->>'user_id', DATE_TRUNC('month', event_time)
)
SELECT 
    cohort_month,
    event_month,
    COUNT(DISTINCT user_id) as active_users,
    EXTRACT(MONTH FROM AGE(event_month, cohort_month)) as months_since_signup
FROM user_cohorts
GROUP BY cohort_month, event_month
ORDER BY cohort_month DESC, event_month;

-- Report 12: Feature usage matrix
SELECT 
    event_type,
    DATE(event_time) as date,
    COUNT(*) as usage_count,
    COUNT(DISTINCT metadata->>'user_id') as unique_users
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '30 days'
GROUP BY event_type, DATE(event_time)
ORDER BY date DESC, usage_count DESC;


-- ============================================================
-- 6. ERROR AND PERFORMANCE TRACKING
-- ============================================================

-- Report 13: Error rate analysis
SELECT 
    DATE(event_time) as date,
    event_type,
    COUNT(*) as error_count,
    metadata->>'error_code' as error_code,
    COUNT(DISTINCT metadata->>'user_id') as affected_users
FROM tracking_events
WHERE event_type = 'error'
    AND event_time > NOW() - INTERVAL '7 days'
GROUP BY DATE(event_time), event_type, metadata->>'error_code'
ORDER BY date DESC, error_count DESC;

-- Report 14: Performance metrics
SELECT 
    metadata->>'page_url' as page,
    COUNT(*) as samples,
    ROUND(AVG((metadata->>'duration_ms')::NUMERIC), 2) as avg_load_time_ms,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::NUMERIC), 2) as median_load_time_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::NUMERIC), 2) as p95_load_time_ms,
    ROUND(MAX((metadata->>'duration_ms')::NUMERIC), 2) as max_load_time_ms
FROM tracking_events
WHERE metadata ? 'duration_ms'
    AND event_time > NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'page_url'
HAVING COUNT(*) > 10
ORDER BY avg_load_time_ms DESC;


-- ============================================================
-- 7. MARKETING & ATTRIBUTION
-- ============================================================

-- Report 15: Referrer analysis
SELECT 
    metadata->>'referrer' as referrer,
    COUNT(*) as total_visits,
    COUNT(DISTINCT metadata->>'user_id') as unique_visitors,
    COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as conversions,
    ROUND(COUNT(CASE WHEN event_type = 'purchase' THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as conversion_rate
FROM tracking_events
WHERE metadata ? 'referrer'
    AND event_time > NOW() - INTERVAL '30 days'
GROUP BY metadata->>'referrer'
ORDER BY total_visits DESC
LIMIT 20;

-- Report 16: Campaign performance
SELECT 
    metadata->>'campaign_id' as campaign_id,
    metadata->>'campaign_name' as campaign_name,
    COUNT(DISTINCT metadata->>'user_id') as unique_users,
    COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchases,
    SUM((metadata->>'amount')::NUMERIC) FILTER (WHERE event_type = 'purchase') as revenue,
    ROUND(AVG((metadata->>'amount')::NUMERIC) FILTER (WHERE event_type = 'purchase'), 2) as avg_order_value
FROM tracking_events
WHERE metadata ? 'campaign_id'
    AND event_time > NOW() - INTERVAL '30 days'
GROUP BY metadata->>'campaign_id', metadata->>'campaign_name'
ORDER BY revenue DESC;


-- ============================================================
-- 8. MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================

-- Create materialized view for daily statistics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_event_stats AS
SELECT 
    DATE(event_time) as date,
    partner_id,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'user_id') as unique_users,
    COUNT(DISTINCT metadata->>'session_id') as unique_sessions
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '90 days'
GROUP BY DATE(event_time), partner_id, event_type;

CREATE UNIQUE INDEX ON mv_daily_event_stats(date, partner_id, event_type);

-- Refresh command (run daily via cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_event_stats;

-- Query the materialized view (much faster)
SELECT * FROM mv_daily_event_stats 
WHERE date > NOW() - INTERVAL '30 days'
ORDER BY date DESC, event_count DESC;


-- ============================================================
-- 9. REAL-TIME DASHBOARDS
-- ============================================================

-- Real-time events (last 5 minutes)
SELECT 
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'user_id') as active_users
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '5 minutes'
GROUP BY event_type
ORDER BY event_count DESC;

-- Current online users (active in last 5 minutes)
SELECT 
    COUNT(DISTINCT metadata->>'user_id') as online_users,
    COUNT(DISTINCT metadata->>'session_id') as active_sessions
FROM tracking_events
WHERE event_time > NOW() - INTERVAL '5 minutes'
    AND metadata ? 'user_id';


-- ============================================================
-- 10. CUSTOM REPORT EXAMPLES
-- ============================================================

-- Custom report: User journey path analysis
WITH user_paths AS (
    SELECT 
        metadata->>'session_id' as session_id,
        STRING_AGG(event_type || ':' || COALESCE(metadata->>'page_url', 'N/A'), ' -> ' ORDER BY event_time) as journey_path
    FROM tracking_events
    WHERE metadata ? 'session_id'
        AND event_time > NOW() - INTERVAL '7 days'
    GROUP BY metadata->>'session_id'
)
SELECT 
    journey_path,
    COUNT(*) as path_count
FROM user_paths
GROUP BY journey_path
HAVING COUNT(*) > 5
ORDER BY path_count DESC
LIMIT 50;
