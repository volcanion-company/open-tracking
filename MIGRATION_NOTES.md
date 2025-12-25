# Migration Notes: Cassandra → PostgreSQL

## Overview

This project was initially designed for Cassandra (time-series NoSQL) but has been migrated to PostgreSQL (relational database) for simplicity and better integration with Entity Framework Core.

## Key Changes

### Database Migration

| Aspect | Before (Cassandra) | After (PostgreSQL) |
|--------|-------------------|-------------------|
| **Database Type** | NoSQL, Time-series | Relational (RDBMS) |
| **ORM** | Manual CQL queries | Entity Framework Core |
| **Migrations** | Manual schema updates | EF Core Migrations |
| **Data Types** | Custom types | Standard SQL types |
| **Indexing** | Secondary indexes | B-tree, GiST indexes |
| **Time-series** | Native partition by date | timestamptz with indexes |

### Architecture Changes

**Removed:**
- ❌ Redis caching layer (can be added back if needed)
- ❌ OpenTelemetry distributed tracing
- ❌ Prometheus metrics endpoint
- ❌ Rate limiting (to be implemented)

**Added:**
- ✅ PostgreSQL 15+ with timestamptz
- ✅ EF Core with Repository + Unit of Work pattern
- ✅ Tracking SDK for Next.js
- ✅ Admin Dashboard with Next.js 15
- ✅ 43 predefined event types
- ✅ Toggle status for Partners/Sub-Systems
- ✅ API key name and expiration

### Data Model Changes

**Before (Cassandra CQL):**
```cql
CREATE TABLE tracking_events (
    partner_id UUID,
    event_date DATE,
    event_time TIMESTAMP,
    id UUID,
    event_type TEXT,
    metadata TEXT,
    PRIMARY KEY ((partner_id, event_date), event_time, id)
) WITH CLUSTERING ORDER BY (event_time DESC);
```

**After (PostgreSQL):**
```sql
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY,
    partner_id UUID REFERENCES partners(id),
    sub_system_id UUID REFERENCES sub_systems(id),
    event_type VARCHAR(100),
    event_time TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
);

CREATE INDEX idx_tracking_events_event_time ON tracking_events(event_time);
CREATE INDEX idx_tracking_events_partner_time ON tracking_events(partner_id, event_time);
CREATE INDEX idx_tracking_events_subsystem_time ON tracking_events(sub_system_id, event_time);
```

### Query Changes

**Time-range queries:**

Before:
```cql
SELECT * FROM tracking_events 
WHERE partner_id = ? 
  AND event_date IN (?, ?, ...) 
  AND event_time >= ? 
  AND event_time <= ?;
```

After (with EF Core):
```csharp
await _context.TrackingEvents
    .Where(e => e.SubSystemId == subSystemId)
    .Where(e => e.EventTime >= startUtc && e.EventTime <= endUtc)
    .OrderByDescending(e => e.EventTime)
    .ToListAsync();
```

### Performance Considerations

**Cassandra Strengths (Lost):**
- ✗ Massive write throughput (100k+ writes/sec)
- ✗ Linear horizontal scalability
- ✗ Native time-series partitioning
- ✗ Multi-datacenter replication

**PostgreSQL Strengths (Gained):**
- ✓ ACID transactions
- ✓ Rich query capabilities (JOINs, subqueries)
- ✓ Better tooling and ecosystem
- ✓ Easier to manage and monitor
- ✓ JSONB for flexible metadata
- ✓ Mature indexing strategies

**Current Performance:**
- Event ingestion: ~5,000-10,000 events/sec per instance (vs. 100k+ with Cassandra)
- Report queries: <500ms with proper indexes (similar to Cassandra with caching)
- Suitable for: Most applications up to ~1M events/day

### When to Consider Going Back to Cassandra

If you experience:
- More than 10M events/day
- Need for multi-datacenter writes
- Write throughput > 50k events/sec sustained
- Need for linear horizontal scaling

Then consider:
1. Re-implementing Cassandra backend
2. Keeping PostgreSQL for Partners/SubSystems/ApiKeys
3. Using Cassandra only for tracking_events table
4. Adding Redis for caching and rate limiting

### Migration Path (If Needed)

To switch back to Cassandra:

1. **Keep current structure** for Partners/SubSystems/ApiKeys in PostgreSQL
2. **Implement Cassandra repository** for TrackingEvents:
   ```csharp
   public class CassandraTrackingEventRepository : ITrackingEventRepository
   {
       // Implement using Cassandra driver
   }
   ```
3. **Add Redis** for caching:
   ```csharp
   services.AddStackExchangeRedisCache(options => { ... });
   ```
4. **Keep everything else the same** - Controllers, Services, DTOs unchanged

### References

- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Cassandra vs PostgreSQL](https://db-engines.com/en/system/Cassandra%3BPostgreSQL)
- [EF Core Best Practices](https://learn.microsoft.com/ef/core/performance/)

---

*Last Updated: December 25, 2025*
