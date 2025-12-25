-- Check tracking events for VOL_HASH subsystem
SELECT 
    te.id,
    te.event_type,
    te.event_time,
    ss.code as subsystem_code,
    ss.name as subsystem_name,
    p.name as partner_name
FROM tracking_events te
JOIN sub_systems ss ON te.sub_system_id = ss.id
JOIN partners p ON te.partner_id = p.id
WHERE ss.code = 'VOL_HASH'
ORDER BY te.event_time DESC
LIMIT 10;

-- Count total events for VOL_HASH
SELECT 
    COUNT(*) as total_events,
    MIN(event_time) as earliest_event,
    MAX(event_time) as latest_event
FROM tracking_events te
JOIN sub_systems ss ON te.sub_system_id = ss.id
WHERE ss.code = 'VOL_HASH';

-- Check if subsystem exists and is active
SELECT id, code, name, status, partner_id 
FROM sub_systems 
WHERE code = 'VOL_HASH';
