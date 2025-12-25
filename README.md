# 🚀 Volcanion Tracking System

Multi-Tenant Tracking Backend API với khả năng mở rộng cao, được xây dựng trên .NET 10, Cassandra, và Redis.

## 📋 Tổng Quan

Hệ thống Tracking đa đối tác (Multi-Partner) cho phép:
- Mỗi Đối tác có nhiều Hệ thống con
- Thu thập và phân tích tracking events với hiệu năng cao
- Thống kê theo hệ thống con hoặc tổng hợp theo đối tác
- Xác thực bằng API Key
- Rate limiting tự động
- Observability với OpenTelemetry và Prometheus

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────────────┐
│           ASP.NET Core Web API                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Controllers                              │  │
│  │  • Partners • Tracking • Reports          │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Services                                 │  │
│  │  • PartnerService • TrackingService       │  │
│  │  • ReportService • CachingService         │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Repository Pattern + Unit Of Work        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    ┌─────────┐         ┌────────────┐
    │  Redis  │         │ Cassandra  │
    │  Cache  │         │ Time-Series│
    └─────────┘         └────────────┘
```

## 🛠️ Công Nghệ

- **.NET 10** - ASP.NET Core Web API
- **Cassandra 4.x** - Time-series database
- **Redis 7.x** - Caching & rate limiting
- **Serilog** - Structured logging
- **OpenTelemetry** - Distributed tracing
- **Prometheus** - Metrics collection

## 📦 Yêu Cầu Hệ Thống

- .NET 10 SDK
- Apache Cassandra 4.x
- Redis 7.x
- Windows/Linux/macOS

## 🚀 Hướng Dẫn Cài Đặt

### 1. Cài Đặt Dependencies

#### Windows (với Chocolatey):
```powershell
# Cài đặt .NET 10 SDK
choco install dotnet-sdk

# Cài đặt Cassandra (hoặc dùng Docker)
# Xem phần Docker bên dưới

# Cài đặt Redis
choco install redis-64
```

#### Docker (Khuyến nghị cho Development):
```bash
# Cassandra
docker run -d --name cassandra -p 9042:9042 cassandra:4.1

# Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 2. Clone và Build Project

```powershell
# Clone repository
git clone https://github.com/your-org/volcanion-tracking.git
cd volcanion-tracking

# Restore packages
dotnet restore

# Build project
dotnet build

# Run migrations (schema tự động tạo khi khởi động)
cd src/VolcanionTracking.Api
dotnet run
```

### 3. Cấu Hình

Chỉnh sửa [appsettings.json](src/VolcanionTracking.Api/appsettings.json):

```json
{
  "Cassandra": {
    "ContactPoints": ["localhost"],
    "Port": 9042,
    "Keyspace": "volcanion_tracking"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "RateLimiting": {
    "RequestsPerMinute": 1000
  }
}
```

## 🎯 Sử Dụng API

### 1. Tạo Partner

```bash
POST /api/v1/partners
Content-Type: application/json

{
  "code": "PARTNER001",
  "name": "Example Partner"
}
```

### 2. Generate API Key

```bash
POST /api/v1/partners/{partnerId}/api-keys

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "apiKey": "ABC123XYZ...", # Lưu key này - chỉ hiển thị 1 lần!
    "expiredAt": null,
    "createdAt": "2025-12-25T10:00:00Z"
  }
}
```

### 3. Tạo Sub-System

```bash
POST /api/v1/partners/{partnerId}/sub-systems
Content-Type: application/json

{
  "code": "WEB_APP",
  "name": "Web Application"
}
```

### 4. Track Event

```bash
POST /api/v1/tracking
X-Api-Key: {your-api-key}
Content-Type: application/json

{
  "subSystemId": "...",
  "eventType": "page_view",
  "metadata": {
    "page": "/home",
    "referrer": "google.com"
  }
}
```

### 5. Bulk Tracking

```bash
POST /api/v1/tracking/bulk
X-Api-Key: {your-api-key}
Content-Type: application/json

{
  "events": [
    {
      "subSystemId": "...",
      "eventType": "click",
      "metadata": { "button": "signup" }
    },
    {
      "subSystemId": "...",
      "eventType": "page_view",
      "metadata": { "page": "/products" }
    }
  ]
}
```

### 6. Báo Cáo - SubSystem

```bash
GET /api/v1/reports/sub-systems/{subSystemId}?startDate=2025-12-01&endDate=2025-12-25

Response:
{
  "success": true,
  "data": {
    "subSystemId": "...",
    "subSystemName": "Web Application",
    "totalEvents": 15234,
    "eventsByType": {
      "page_view": 10000,
      "click": 5234
    },
    "timeSeries": [
      { "timestamp": "2025-12-01T00:00:00Z", "count": 1500 },
      { "timestamp": "2025-12-01T01:00:00Z", "count": 1200 }
    ]
  }
}
```

### 7. Báo Cáo - Partner

```bash
GET /api/v1/reports/partners/{partnerId}?startDate=2025-12-01&endDate=2025-12-25

Response:
{
  "success": true,
  "data": {
    "partnerId": "...",
    "partnerName": "Example Partner",
    "totalEvents": 50000,
    "topSubSystems": [
      {
        "subSystemId": "...",
        "subSystemName": "Web App",
        "eventCount": 30000
      }
    ],
    "timeSeries": [...]
  }
}
```

## 📊 Monitoring

### Prometheus Metrics

Truy cập: `http://localhost:5000/metrics`

Metrics có sẵn:
- `http_server_request_duration_seconds` - API latency
- `http_server_active_requests` - Số request đang xử lý
- `process_cpu_seconds_total` - CPU usage
- `dotnet_gc_collections_count` - GC collections

### Health Check

```bash
GET /api/v1/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-12-25T10:00:00Z",
  "service": "Volcanion Tracking API"
}
```

### Logs

Logs được ghi vào:
- Console (structured)
- `logs/volcanion-tracking-{date}.log`

## 🔐 Security

### API Key Authentication

Tất cả tracking endpoints yêu cầu header:
```
X-Api-Key: {your-api-key}
```

### Rate Limiting

- Default: 1000 requests/minute per API key
- Response headers:
  - `X-RateLimit-Limit`: Giới hạn
  - `X-RateLimit-Remaining`: Số request còn lại
  - `X-RateLimit-Reset`: Thời gian reset

### API Key Best Practices

1. **Lưu trữ an toàn**: API Key chỉ hiển thị 1 lần khi generate
2. **Rotation**: Định kỳ revoke và tạo key mới
3. **Expired Date**: Set expiration date cho keys
4. **Monitoring**: Theo dõi usage qua logs

## 🧪 Testing

### Test với cURL

```bash
# 1. Tạo partner
curl -X POST http://localhost:5000/api/v1/partners \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST001","name":"Test Partner"}'

# 2. Generate API Key
curl -X POST http://localhost:5000/api/v1/partners/{id}/api-keys

# 3. Track event
curl -X POST http://localhost:5000/api/v1/tracking \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subSystemId":"...","eventType":"test","metadata":{}}'
```

### Test với Postman

Import collection từ `docs/postman-collection.json` (tạo sau nếu cần)

## 📈 Performance

### Targets

- **Event Ingestion**: < 50ms p99
- **Throughput**: > 10,000 events/sec per instance
- **Report Queries**: < 500ms p99 (cached)
- **Cache Hit Rate**: > 95%

### Optimization

1. **Bulk Insert**: Sử dụng `/api/v1/tracking/bulk` cho multiple events
2. **Caching**: Reports được cache 5 phút
3. **Background Processing**: Events được xử lý batch qua Channel
4. **Connection Pooling**: Redis và Cassandra connections được pool

## 🔧 Troubleshooting

### Cassandra Connection Failed

```powershell
# Kiểm tra Cassandra đang chạy
docker ps | grep cassandra

# Xem logs
docker logs cassandra

# Restart container
docker restart cassandra
```

### Redis Connection Failed

```powershell
# Kiểm tra Redis
redis-cli ping
# Phải trả về: PONG

# Hoặc với Docker
docker exec -it redis redis-cli ping
```

### High Memory Usage

- Tăng batch size trong `appsettings.json`:
  ```json
  "BackgroundWorker": {
    "BatchSize": 200,
    "BatchTimeoutMs": 500
  }
  ```

## 🚀 Deployment

### Production Checklist

- [ ] Set production connection strings
- [ ] Configure Cassandra replication factor > 1
- [ ] Setup Redis Sentinel/Cluster
- [ ] Enable HTTPS
- [ ] Configure proper CORS policies
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Configure log aggregation (ELK/Loki)
- [ ] Set rate limits per partner tier
- [ ] Backup strategy for Cassandra

### Docker Deployment (Future)

```bash
# Build image
docker build -t volcanion-tracking:latest .

# Run container
docker run -d -p 5000:8080 \
  -e Cassandra__ContactPoints__0=cassandra-host \
  -e Redis__ConnectionString=redis-host:6379 \
  volcanion-tracking:latest
```

## 🔮 Future Enhancements

### Planned Features

1. **Kafka Integration**: Replace Channel với Kafka for distributed processing
2. **ClickHouse**: Separate analytics database
3. **GraphQL API**: Alternative to REST
4. **Encrypted Tracking**: AES/RSA payload encryption
5. **Replay Attack Prevention**: Nonce validation
6. **API Gateway**: Kong/Ocelot/YARP integration
7. **Multi-Region**: Geographic distribution

### Extensibility Points

- `ITrackingPayloadDecryptor`: Interface cho encrypted tracking
- `IReportService`: Có thể thay thế backend (ClickHouse)
- Channel → Kafka: Minimal code change

## 📚 Documentation

- [Architecture](ARCHITECTURE.md) - Kiến trúc chi tiết
- [API Reference](docs/api-reference.md) - API documentation (tạo sau)
- [Database Schema](docs/schema.md) - Cassandra schema (tạo sau)

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 👥 Contact

- Project Lead: Your Name
- Email: your.email@example.com
- Slack: #volcanion-tracking

---

**Built with ❤️ using .NET 10, Cassandra, and Redis**
