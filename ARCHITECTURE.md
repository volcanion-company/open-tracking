# Volcanion Tracking System - Architecture

## 🏗️ Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  (Partner Applications, Sub-Systems, Admin Dashboard)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LB                           │
│                   (Future: Rate Limiting)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ASP.NET CORE WEB API                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              MIDDLEWARE PIPELINE                          │  │
│  │  • ApiKey Authentication                                  │  │
│  │  • Rate Limiting (per ApiKey)                             │  │
│  │  • Request Logging                                        │  │
│  │  • Exception Handling                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLERS                            │  │
│  │  • PartnersController (CRUD, ApiKeys, SubSystems)         │  │
│  │  • TrackingController (Ingest events)                     │  │
│  │  • ReportsController (Statistics, Analytics)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     SERVICES                              │  │
│  │  • PartnerService                                         │  │
│  │  • ApiKeyService (Generate, Validate, Hash)               │  │
│  │  • SubSystemService                                       │  │
│  │  • TrackingService (Ingest, Queue)                        │  │
│  │  • ReportService (Aggregation, Time-series)               │  │
│  │  • CachingService (Redis wrapper)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            REPOSITORY PATTERN + UOW                       │  │
│  │  • IPartnerRepository                                     │  │
│  │  • IApiKeyRepository                                      │  │
│  │  • ISubSystemRepository                                   │  │
│  │  • ITrackingEventRepository                               │  │
│  │  • IUnitOfWork                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              BACKGROUND WORKERS                           │  │
│  │  • TrackingEventProcessor (Channel-based)                 │  │
│  │  • (Future: Kafka Producer)                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────┬───────────────────────────┘
                        │             │
         ┌──────────────┘             └──────────────┐
         ▼                                            ▼
┌─────────────────┐                         ┌─────────────────┐
│   REDIS CACHE   │                         │ CASSANDRA DB    │
│                 │                         │                 │
│ • ApiKey Cache  │                         │ • Partners      │
│ • Partner Info  │                         │ • ApiKeys       │
│ • SubSystem Map │                         │ • SubSystems    │
│ • Report Cache  │                         │ • TrackingEvents│
│ • Rate Limit    │                         │   (Time-series) │
└─────────────────┘                         └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OBSERVABILITY STACK                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │   Serilog   │  │ OpenTelemetry│  │    Prometheus        │    │
│  │             │  │              │  │                      │    │
│  │ • Console   │  │ • Traces     │  │ • /metrics endpoint  │    │
│  │ • File      │  │ • Metrics    │  │ • Custom counters    │    │
│  │ • Structured│  │              │  │ • API latency        │    │
│  └─────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### 1. Tracking Event Ingestion
```
Client → [API Key Auth] → TrackingController 
  → TrackingService.EnqueueEvent() 
  → Channel<TrackingEvent> 
  → BackgroundWorker.ProcessEvent() 
  → Repository.BulkInsert() 
  → Cassandra
```

### 2. Partner Management
```
Admin → PartnersController → PartnerService 
  → UnitOfWork → Repository → Cassandra
  → Redis Cache Invalidation
```

### 3. Report Generation
```
Client → ReportsController → ReportService
  → Check Redis Cache
  → If miss: Query Cassandra (time-range)
  → Aggregate in-memory
  → Cache result
  → Return JSON
```

## 🗄️ Database Strategy

### Cassandra Schema Design

#### Partners Table
```cql
CREATE TABLE partners (
    id UUID PRIMARY KEY,
    code TEXT,
    name TEXT,
    status TEXT,
    created_at TIMESTAMP
);
CREATE INDEX ON partners (code);
```

#### Partner API Keys Table
```cql
CREATE TABLE partner_api_keys (
    id UUID PRIMARY KEY,
    partner_id UUID,
    api_key_hash TEXT,
    status TEXT,
    expired_at TIMESTAMP,
    created_at TIMESTAMP
);
CREATE INDEX ON partner_api_keys (partner_id);
CREATE INDEX ON partner_api_keys (api_key_hash);
```

#### Sub Systems Table
```cql
CREATE TABLE sub_systems (
    id UUID PRIMARY KEY,
    partner_id UUID,
    code TEXT,
    name TEXT,
    status TEXT,
    created_at TIMESTAMP
);
CREATE INDEX ON sub_systems (partner_id);
```

#### Tracking Events Table (Time-Series Optimized)
```cql
CREATE TABLE tracking_events (
    partner_id UUID,
    sub_system_id UUID,
    event_date DATE,
    event_time TIMESTAMP,
    id UUID,
    event_type TEXT,
    metadata TEXT,
    ip TEXT,
    user_agent TEXT,
    PRIMARY KEY ((partner_id, event_date), event_time, id)
) WITH CLUSTERING ORDER BY (event_time DESC);

-- Alternative for sub-system queries
CREATE TABLE tracking_events_by_subsystem (
    sub_system_id UUID,
    event_date DATE,
    event_time TIMESTAMP,
    id UUID,
    partner_id UUID,
    event_type TEXT,
    metadata TEXT,
    ip TEXT,
    user_agent TEXT,
    PRIMARY KEY ((sub_system_id, event_date), event_time, id)
) WITH CLUSTERING ORDER BY (event_time DESC);
```

### Future: ClickHouse Integration
```sql
-- Materialized view pattern (design only)
CREATE TABLE tracking_events_clickhouse (
    partner_id UUID,
    sub_system_id UUID,
    event_type String,
    event_time DateTime64(3),
    metadata String,
    ip String,
    user_agent String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (partner_id, sub_system_id, event_time);
```

## 🔐 Security Design

### API Key Flow
```
1. Partner requests API Key
2. System generates: uuid4 or cryptographically secure random
3. Hash with PBKDF2/SHA256 (salt included)
4. Return plain key ONCE
5. Store only hash in database
6. Future requests: hash input → compare with stored hash
```

### Rate Limiting Strategy
```
Redis Key: rate_limit:{api_key}:{window}
Window: 1 minute sliding window
Limit: 1000 requests/minute (configurable per partner)
Algorithm: Token Bucket or Sliding Log
```

### Replay Attack Prevention (Design)
```
Request includes:
- timestamp (ISO-8601)
- nonce (UUID)

Validation:
- Check timestamp within 5 minutes
- Check nonce not used (Redis set with TTL)
```

## 📈 Scalability Considerations

### Current Implementation
- In-memory Channel for event queue
- Single instance processing
- Redis for distributed caching
- Cassandra for horizontal scaling

### Future Scale Path
```
Current → Kafka/RabbitMQ → Multiple Consumers
       → ClickHouse for analytics
       → Read replicas
       → Distributed tracing (Jaeger)
       → API Gateway (Kong/Ocelot)
```

## 🎯 Performance Targets

- Event ingestion: < 50ms p99
- Tracking throughput: > 10,000 events/sec per instance
- Report queries: < 500ms p99 (with cache)
- API Key validation: < 5ms (cached)
- Cache hit rate: > 95% for hot data

## 📦 Technology Stack

- **Runtime**: .NET 10
- **Web Framework**: ASP.NET Core
- **Database**: Cassandra 4.x
- **Cache**: Redis 7.x
- **Logging**: Serilog
- **Metrics**: OpenTelemetry + Prometheus
- **Pattern**: Repository + Unit Of Work

## 🔄 Deployment Model

```
Development: Local Cassandra + Redis
Staging: Docker Compose (single node)
Production: 
  - K8s / VM cluster
  - Cassandra cluster (3+ nodes)
  - Redis Sentinel/Cluster
  - Multiple API instances behind LB
```
