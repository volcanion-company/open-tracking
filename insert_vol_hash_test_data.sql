-- Insert test tracking events for VOL_HASH
-- This will create events for the last 30 days

DO $$
DECLARE
    vol_hash_id UUID := '9901f003-072c-41ad-a0c4-f6aa606ef40f';
    vol_partner_id UUID := '73d40a04-f705-4e00-bf2e-ed6ece4d4488';
    event_types TEXT[] := ARRAY['page_view', 'click', 'purchase', 'signup', 'error'];
    current_date TIMESTAMPTZ;
    i INTEGER;
    j INTEGER;
    random_type TEXT;
BEGIN
    -- Generate events for last 30 days
    FOR i IN 0..29 LOOP
        current_date := NOW() - (i || ' days')::INTERVAL;
        
        -- Create 20-50 events per day
        FOR j IN 1..(20 + FLOOR(RANDOM() * 30)::INTEGER) LOOP
            -- Pick random event type
            random_type := event_types[1 + FLOOR(RANDOM() * 5)::INTEGER];
            
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
                current_date + (RANDOM() * INTERVAL '24 hours'),
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '192.168.' || FLOOR(RANDOM() * 255)::TEXT || '.' || FLOOR(RANDOM() * 255)::TEXT,
                jsonb_build_object(
                    'browser', 'Chrome',
                    'os', 'Windows',
                    'test_data', true
                )
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Successfully inserted tracking events for VOL_HASH';
    
    -- Show summary
    RAISE NOTICE 'Total events: %', (SELECT COUNT(*) FROM tracking_events WHERE sub_system_id = vol_hash_id);
END $$;

-- Verify the data
SELECT 
    event_type,
    COUNT(*) as count,
    MIN(event_time) as earliest,
    MAX(event_time) as latest
FROM tracking_events
WHERE sub_system_id = '9901f003-072c-41ad-a0c4-f6aa606ef40f'
GROUP BY event_type
ORDER BY count DESC;
