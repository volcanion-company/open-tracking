-- Insert tracking events for VOL_HASH from January 1, 2025 to December 30, 2025
-- Approximately 11234-15154 events per day (random)

DO $$
DECLARE
    vol_partner_id UUID := '73d40a04-f705-4e00-bf2e-ed6ece4d4488';
    vol_hash_id UUID := '9901f003-072c-41ad-a0c4-f6aa606ef40f';
    -- Comprehensive event types for VOL_HASH system
    event_types TEXT[] := ARRAY[
        -- File Operations
        'FILE_UPLOAD_SUCCESS', 'FILE_UPLOAD_FAILED', 
        'FILE_DELETE_SUCCESS', 'FILE_DELETE_FAILED', 
        'FILE_ACCESS_AUDIT',
        -- Hash Operations
        'HASH_GENERATION_START', 'HASH_GENERATION_COMPLETE',
        'HASH_VERIFICATION_PASS', 'HASH_VERIFICATION_FAIL',
        -- System Operations
        'BATCH_PROCESS_START', 'BATCH_PROCESS_COMPLETE',
        'SYSTEM_BACKUP_START', 'SYSTEM_BACKUP_COMPLETE',
        'SYSTEM_UPDATE_START', 'SYSTEM_ALERT',
        'AUTO_SCALING_TRIGGER', 'CACHE_FLUSH',
        -- Storage & Capacity
        'STORAGE_CAPACITY_WARNING', 
        'STORAGE_REPLICATION_START', 'STORAGE_REPLICATION_COMPLETE',
        'QUOTA_EXCEEDED', 'DISK_FAILURE_WARNING', 'DATA_RETENTION_PURGE',
        -- Security & Compliance
        'INTEGRITY_CHECK_ALERT',
        'SECURITY_SCAN_START', 'SECURITY_SCAN_COMPLETE',
        'COMPLIANCE_CHECK_START', 'COMPLIANCE_CHECK_COMPLETE',
        'ENCRYPTION_KEY_ROTATION', 'AUDIT_LOG_ACCESS',
        -- Monitoring & Metrics
        'API_REQUEST', 'PERFORMANCE_METRIC',
        'USER_SESSION_START', 'USER_SESSION_END',
        'LOAD_BALANCER_HEALTH_CHECK_FAIL', 'LOAD_BALANCER_HEALTH_CHECK_PASS',
        'SLA_VIOLATION', 'NETWORK_THROTTLING',
        -- Configuration & Database
        'CONFIGURATION_CHANGE', 'DATABASE_INDEX_REBUILD', 'EXTERNAL_API_CALL'
    ];
    user_agents TEXT[] := ARRAY[
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    browsers TEXT[] := ARRAY['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
    os_list TEXT[] := ARRAY['Windows', 'MacOS', 'Linux', 'iOS', 'Android'];
    
    start_date DATE := '2025-01-01';
    end_date DATE := '2025-12-30';
    current_day TIMESTAMPTZ;
    day_offset INTEGER;
    events_per_day INTEGER;
    i INTEGER;
    random_type TEXT;
    random_ua TEXT;
    random_browser TEXT;
    random_os TEXT;
    
    total_inserted INTEGER := 0;
    batch_size INTEGER := 1000;
    batch_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting to generate tracking events...';
    RAISE NOTICE 'Date range: % to %', start_date, end_date;
    
    -- Loop through each day
    FOR day_offset IN 0..(end_date - start_date) LOOP
        current_day := (start_date + day_offset * INTERVAL '1 day')::TIMESTAMPTZ;
        
        -- Vary events per day: 11234-15154 events (average ~13194)
        events_per_day := 11234 + FLOOR(RANDOM() * 3921)::INTEGER;
        
        -- Generate events for this day
        FOR i IN 1..events_per_day LOOP
            -- Pick random values
            random_type := event_types[1 + FLOOR(RANDOM() * array_length(event_types, 1))::INTEGER];
            random_ua := user_agents[1 + FLOOR(RANDOM() * array_length(user_agents, 1))::INTEGER];
            random_browser := browsers[1 + FLOOR(RANDOM() * array_length(browsers, 1))::INTEGER];
            random_os := os_list[1 + FLOOR(RANDOM() * array_length(os_list, 1))::INTEGER];
            
            INSERT INTO tracking_events (
                id,
                partner_id,
                sub_system_id,
                event_type,
                event_time,
                user_agent,
                ip,
                metadata
            ) VALUES (
                gen_random_uuid(),
                vol_partner_id,
                vol_hash_id,
                random_type,
                -- Random time throughout the day
                current_day + (RANDOM() * INTERVAL '24 hours'),
                random_ua,
                -- Random IP address
                '192.' || FLOOR(RANDOM() * 256)::TEXT || '.' || 
                FLOOR(RANDOM() * 256)::TEXT || '.' || 
                FLOOR(RANDOM() * 256)::TEXT,
                jsonb_build_object(
                    'browser', random_browser,
                    'os', random_os,
                    'screen_width', (1024 + FLOOR(RANDOM() * 2000))::INTEGER,
                    'screen_height', (768 + FLOOR(RANDOM() * 1500))::INTEGER,
                    'referrer', CASE 
                        WHEN RANDOM() < 0.3 THEN 'https://google.com'
                        WHEN RANDOM() < 0.5 THEN 'https://facebook.com'
                        WHEN RANDOM() < 0.7 THEN 'https://twitter.com'
                        ELSE 'direct'
                    END,
                    'session_id', gen_random_uuid()::TEXT,
                    'test_data', true
                )
            );
            
            total_inserted := total_inserted + 1;
            
            -- Log progress every 1000 records
            IF total_inserted % batch_size = 0 THEN
                batch_count := batch_count + 1;
                RAISE NOTICE 'Progress: % events inserted (Day: %, %/%)', 
                    total_inserted, 
                    to_char(current_day, 'YYYY-MM-DD'),
                    day_offset + 1,
                    (end_date - start_date) + 1;
            END IF;
        END LOOP;
        
        -- Log completion of each day
        RAISE NOTICE 'Completed %: % events', to_char(current_day, 'YYYY-MM-DD'), events_per_day;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Data generation completed!';
    RAISE NOTICE 'Total events inserted: %', total_inserted;
    RAISE NOTICE 'Date range: % to %', start_date, end_date;
    RAISE NOTICE 'Average events per day: %', ROUND(total_inserted::NUMERIC / ((end_date - start_date) + 1), 2);
    RAISE NOTICE '========================================';
    
END $$;

-- Verify the inserted data
SELECT 
    COUNT(*) as total_events,
    MIN(event_time) as earliest_event,
    MAX(event_time) as latest_event,
    COUNT(DISTINCT DATE(event_time)) as days_with_events
FROM tracking_events
WHERE sub_system_id = '9901f003-072c-41ad-a0c4-f6aa606ef40f'
    AND partner_id = '73d40a04-f705-4e00-bf2e-ed6ece4d4488';

-- Show daily distribution
SELECT 
    DATE(event_time) as event_date,
    COUNT(*) as events_count,
    COUNT(DISTINCT event_type) as unique_event_types
FROM tracking_events
WHERE sub_system_id = '9901f003-072c-41ad-a0c4-f6aa606ef40f'
    AND partner_id = '73d40a04-f705-4e00-bf2e-ed6ece4d4488'
GROUP BY DATE(event_time)
ORDER BY event_date;

-- Show event type distribution
SELECT 
    event_type,
    COUNT(*) as count,
    ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*)::NUMERIC FROM tracking_events 
        WHERE sub_system_id = '9901f003-072c-41ad-a0c4-f6aa606ef40f') * 100, 2) as percentage
FROM tracking_events
WHERE sub_system_id = '9901f003-072c-41ad-a0c4-f6aa606ef40f'
    AND partner_id = '73d40a04-f705-4e00-bf2e-ed6ece4d4488'
GROUP BY event_type
ORDER BY count DESC;
