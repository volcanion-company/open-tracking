# 🌋 Volcanion Tracking System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-10.0-purple.svg)](https://dotnet.microsoft.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)

Multi-tenant event tracking system với khả năng mở rộng cao, được xây dựng trên .NET 10, PostgreSQL, và Next.js. Hệ thống cho phép theo dõi và phân tích sự kiện từ nhiều đối tác và hệ thống con với hiệu năng cao.

## 📋 Tổng Quan

### Tính Năng Chính

- 🏢 **Multi-Tenant Architecture** - Quản lý nhiều đối tác (Partners) và hệ thống con (Sub-Systems)
- 📊 **Event Tracking** - Thu thập và lưu trữ tracking events với 43+ event types
- 📈 **Reports & Analytics** - Báo cáo theo thời gian thực với biểu đồ (Bar & Line charts)
- 🔐 **API Key Authentication** - Xác thực bảo mật cho mỗi đối tác/hệ thống
- ⚡ **High Performance** - Batch processing, caching với Redis
- 🎨 **Admin Dashboard** - Giao diện quản trị hiện đại với Next.js + Material-UI
- 📱 **Tracking SDK** - SDK tự động tracking cho Next.js applications
- 🔄 **Auto-Tracking** - Tự động thu thập clicks, forms, API calls, errors

### 43 Event Types

Hệ thống hỗ trợ 43 loại sự kiện được phân thành 7 nhóm:
- **File Operations** (7 types) - Upload, Download, Delete, Move, Rename, Share, Access
- **Hash Operations** (7 types) - Generate, Verify, Compare, Invalid, Update, Lookup
- **System Operations** (6 types) - Start, Stop, Error, Warning, Info, Health Check
- **Storage Operations** (5 types) - Read, Write, Delete, Quota Exceeded, Clear
- **Security Operations** (7 types) - Auth Login/Logout/Failed, Token operations, Permission
- **Monitoring Operations** (5 types) - CPU, Memory, Disk, Network, Service monitoring
- **Configuration Operations** (6 types) - Update, Load, Error, Reset, Export, Import

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATIONS                        │
│  (Partner Apps, Sub-Systems, SDKs, Admin Dashboard)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ASP.NET CORE WEB API                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              MIDDLEWARE PIPELINE                          │  │
│  │  • API Key Authentication                                 │  │
│  │  • Request Logging                                        │  │
│  │  • Exception Handling                                     │  │
│  │  • CORS Policy                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLERS                            │  │
│  │  • PartnersController (CRUD, SubSystems, API Keys)        │  │
│  │  • TrackingController (Event ingestion)                   │  │
│  │  • ReportsController (Analytics, Statistics)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     SERVICES                              │  │
│  │  • PartnerService                                         │  │
│  │  • SubSystemService                                       │  │
│  │  • ApiKeyService (Hash, Validate)                         │  │
│  │  • TrackingService (Batch processing)                     │  │
│  │  • ReportService (Aggregation, Time-series)               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            REPOSITORY + UNIT OF WORK                      │  │
│  │  • PartnerRepository                                      │  │
│  │  • SubSystemRepository                                    │  │
│  │  • ApiKeyRepository                                       │  │
│  │  • TrackingEventRepository                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  PostgreSQL DB  │
              │                 │
              │  • Partners     │
              │  • SubSystems   │
              │  • ApiKeys      │
              │  • TrackingEvents│
              │    (timestamptz)│
              └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                            │
│                    (Next.js 15 + TypeScript)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Pages (App Router)                                       │  │
│  │  • Dashboard • Partners • Sub-Systems • Reports           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Tracking SDK                                             │  │
│  │  • Auto-tracking (clicks, forms, API, errors)             │  │
│  │  • Batch queue • sendBeacon • Session tracking            │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Components                                               │  │
│  │  • DataTable (pagination, filtering, sorting)             │  │
│  │  • Charts (Bar, Line with Chart.js)                       │  │
│  │  • Forms (MUI components)                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **.NET 10** - ASP.NET Core Web API
- **PostgreSQL 15+** - Relational database với timestamptz
- **Entity Framework Core** - ORM với migrations
- **Serilog** - Structured logging

### Frontend (Admin Dashboard)
- **Next.js 15.1** - React framework với App Router
- **TypeScript 5** - Type safety
- **Material-UI 6.3** - UI component library
- **Chart.js 4.4** - Data visualization
- **Zustand 5** - State management
- **Axios** - HTTP client

### Tracking SDK
- **TypeScript** - Full type safety
- **React Hooks** - Modern React patterns
- **Batch Processing** - Queue-based event collection
- **sendBeacon API** - Reliable event delivery
- **Auto-tracking** - Zero-config tracking utilities

## 📦 Project Structure

```
volcanion-tracking/
├── src/
│   ├── VolcanionTracking.Api/          # Backend API
│   │   ├── Controllers/                # API endpoints
│   │   ├── Services/                   # Business logic
│   │   ├── Data/                       # EF Core DbContext & Repositories
│   │   ├── Models/                     # Domain models, DTOs
│   │   └── Middleware/                 # Custom middleware
│   │
│   └── VolcanionTracking.Client/       # .NET SDK for client apps
│
├── admin-dashboard/                    # Next.js Admin Panel
│   ├── src/
│   │   ├── app/                        # Pages (App Router)
│   │   │   ├── dashboard/              # Dashboard page
│   │   │   ├── partners/               # Partners CRUD
│   │   │   ├── sub-systems/            # Sub-systems management
│   │   │   └── reports/                # Analytics & Reports
│   │   │
│   │   ├── components/                 # React components
│   │   │   ├── DataTable/              # Reusable table with pagination
│   │   │   └── Layout/                 # Layout components
│   │   │
│   │   ├── lib/                        # Utilities & SDK
│   │   │   └── tracking/               # 🔥 Volcanion Tracking SDK
│   │   │       ├── config.ts           # Environment configuration
│   │   │       ├── client.ts           # Core tracker with batching
│   │   │       ├── hooks.ts            # React hooks
│   │   │       ├── TrackingProvider.tsx # App provider
│   │   │       ├── auto-tracking.ts    # Auto-tracking utilities
│   │   │       └── index.ts            # Main exports
│   │   │
│   │   ├── services/                   # API services
│   │   └── stores/                     # Zustand stores
│   │
│   └── TRACKING_SDK.md                 # SDK documentation
│
├── database/                           # Database scripts
│   ├── apply-indexes.sql               # Performance indexes
│   ├── query-optimization.sql          # Optimization tips
│   └── README.md                       # Database docs
│
├── ARCHITECTURE.md                     # System architecture
├── CONTRIBUTING.md                     # Contribution guidelines
└── README.md                           # This file
```

## 🚀 Quick Start

### Prerequisites

- .NET 10 SDK ([Download](https://dotnet.microsoft.com/download/dotnet/10.0))
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 15+ ([Download](https://www.postgresql.org/download/))
- Git

### 1. Clone Repository

```bash
git clone https://github.com/volcanion-company/tracking-open-source.git
cd volcanion-tracking
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb volcanion_tracking

# Or using psql
psql -U postgres
CREATE DATABASE volcanion_tracking;
\q
```

### 3. Backend Setup

```bash
cd src/VolcanionTracking.Api

# Update connection string in appsettings.Development.json
# "DefaultConnection": "Host=localhost;Database=volcanion_tracking;Username=postgres;Password=your_password"

# Restore packages
dotnet restore

# Run migrations (automatic on first startup)
dotnet run

# Backend will run on: http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

### 4. Frontend Setup

```bash
cd admin-dashboard

# Install dependencies
yarn install
# or
npm install

# Copy environment file
cp .env.local.example .env.local

# Update .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Start development server
yarn dev

# Admin Dashboard: http://localhost:3000
```

### 5. Create First Partner & API Key

1. Go to http://localhost:3000/partners
2. Click "Add Partner"
3. Create a new partner
4. Go to "Sub-Systems" tab and create a sub-system
5. Go to "API Keys" tab and generate an API key
6. Copy the API key (shown only once!)

### 6. Test Tracking

```bash
# Using curl
curl -X POST http://localhost:5000/api/v1/tracking/events \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your-api-key" \
  -d '{
    "subSystemId": "your-subsystem-id",
    "eventType": "SYSTEM_INFO",
    "metadata": {
      "action": "test",
      "message": "Hello World"
    }
  }'

# Check reports at: http://localhost:3000/reports
```

## 📊 Features in Detail

### 1. Partner Management

- **CRUD Operations** - Create, Read, Update, Delete partners
- **Status Toggle** - Active/Inactive partners
- **Sub-Systems** - Each partner can have multiple sub-systems
- **API Keys** - Generate and manage API keys per partner
- **Search & Filter** - Real-time search with pagination

### 2. Event Tracking

**Supported Event Types (43 types):**

| Category | Event Types | Count |
|----------|-------------|-------|
| File Operations | FILE_UPLOADED, FILE_DOWNLOADED, FILE_DELETED, FILE_MOVED, FILE_RENAMED, FILE_SHARED, FILE_ACCESSED | 7 |
| Hash Operations | HASH_GENERATED, HASH_VERIFIED, HASH_COMPARED, HASH_INVALID, HASH_UPDATED, HASH_LOOKUP_SUCCESS, HASH_LOOKUP_FAILED | 7 |
| System Operations | SYSTEM_STARTED, SYSTEM_STOPPED, SYSTEM_ERROR, SYSTEM_WARNING, SYSTEM_INFO, SYSTEM_HEALTH_CHECK | 6 |
| Storage Operations | STORAGE_READ, STORAGE_WRITE, STORAGE_DELETE, STORAGE_QUOTA_EXCEEDED, STORAGE_CLEARED | 5 |
| Security Operations | AUTH_LOGIN, AUTH_LOGOUT, AUTH_FAILED, AUTH_TOKEN_GENERATED, AUTH_TOKEN_EXPIRED, PERMISSION_DENIED, RATE_LIMIT_EXCEEDED | 7 |
| Monitoring | MONITOR_CPU_HIGH, MONITOR_MEMORY_HIGH, MONITOR_DISK_FULL, MONITOR_NETWORK_ERROR, MONITOR_SERVICE_DOWN | 5 |
| Configuration | CONFIG_UPDATED, CONFIG_LOADED, CONFIG_ERROR, CONFIG_RESET, CONFIG_EXPORTED, CONFIG_IMPORTED | 6 |

**Tracking Features:**
- Batch event ingestion
- Automatic timestamp with timezone (timestamptz)
- IP address and User-Agent capture
- JSON metadata support
- High-performance indexing

### 3. Reports & Analytics

**Partner Reports:**
- Total events by sub-system
- Time series data (daily aggregation)
- Event distribution charts

**Sub-System Reports:**
- Events by event type
- Time series (hourly/daily)
- Toggle between Bar and Line charts
- Multi-series line charts (one line per event type)
- Date range filtering

### 4. Tracking SDK for Next.js

Complete SDK for automatic tracking in Next.js applications.

**Installation:**
```bash
# SDK is included in admin-dashboard/src/lib/tracking
# See TRACKING_SDK.md for full documentation
```

**Quick Example:**
```typescript
// 1. Wrap app with TrackingProvider
import { TrackingProvider } from '@/lib/tracking';

export default function RootLayout({ children }) {
  return (
    <TrackingProvider>
      {children}
    </TrackingProvider>
  );
}

// 2. Use in components
import { useTracking } from '@/lib/tracking';

function MyComponent() {
  const { track } = useTracking();
  
  const handleClick = () => {
    track('BUTTON_CLICKED', { button: 'submit' });
  };
}

// 3. Enable auto-tracking
import { enableAllAutoTracking } from '@/lib/tracking';
enableAllAutoTracking(); // Tracks clicks, forms, API calls, errors
```

**SDK Features:**
- ✅ Environment-based configuration
- ✅ Automatic batching (configurable size & interval)
- ✅ Resilient delivery (fetch + sendBeacon)
- ✅ React hooks integration
- ✅ Auto-tracking utilities
- ✅ Session tracking
- ✅ TypeScript support

See [admin-dashboard/TRACKING_SDK.md](admin-dashboard/TRACKING_SDK.md) for complete documentation.

## 🔐 API Authentication

All tracking endpoints require API Key authentication:

```bash
# Header format
X-Api-Key: your-api-key-here

# Example
curl -H "X-Api-Key: abc123..." http://localhost:5000/api/v1/tracking/events
```

**API Key Features:**
- Hashed storage (never stored in plain text)
- Optional expiration date
- Per-partner/sub-system keys
- Easy revocation

## 📡 API Endpoints

### Partners API
```
GET    /api/v1/partners              # List all partners
GET    /api/v1/partners/{id}         # Get partner by ID
POST   /api/v1/partners              # Create partner
PUT    /api/v1/partners/{id}         # Update partner
DELETE /api/v1/partners/{id}         # Delete partner
```

### Sub-Systems API
```
GET    /api/v1/partners/{id}/sub-systems              # List sub-systems
GET    /api/v1/partners/{id}/sub-systems/{subId}     # Get sub-system
POST   /api/v1/partners/{id}/sub-systems              # Create sub-system
PUT    /api/v1/partners/{id}/sub-systems/{subId}     # Update sub-system
DELETE /api/v1/partners/{id}/sub-systems/{subId}     # Delete sub-system
```

### API Keys
```
GET    /api/v1/partners/{id}/api-keys              # List API keys
POST   /api/v1/partners/{id}/api-keys              # Generate API key
DELETE /api/v1/partners/{id}/api-keys/{keyId}     # Revoke API key
```

### Tracking API
```
POST   /api/v1/tracking/events       # Ingest tracking event(s)
```

### Reports API
```
GET    /api/v1/reports/partners/{id}              # Partner report
GET    /api/v1/reports/sub-systems/{id}           # Sub-system report
```

Full API documentation: http://localhost:5000/swagger

## 🗄️ Database Schema

### Key Tables

**partners**
- `id` (uuid, PK)
- `code` (varchar, unique)
- `name` (varchar)
- `description` (text)
- `status` (varchar)
- `created_at`, `updated_at` (timestamptz)

**sub_systems**
- `id` (uuid, PK)
- `partner_id` (uuid, FK)
- `code` (varchar, unique)
- `name` (varchar)
- `status` (varchar)
- `created_at`, `updated_at` (timestamptz)

**partner_api_keys**
- `id` (uuid, PK)
- `partner_id` (uuid, FK)
- `name` (varchar)
- `api_key_hash` (varchar) - Hashed with PBKDF2
- `expired_at` (timestamptz, nullable)
- `status` (varchar)
- `created_at` (timestamptz)

**tracking_events**
- `id` (uuid, PK)
- `partner_id` (uuid, FK)
- `sub_system_id` (uuid, FK)
- `event_type` (varchar) - One of 43 types
- `event_time` (timestamptz) - Indexed for time-series queries
- `ip_address` (varchar)
- `user_agent` (text)
- `metadata` (jsonb) - Flexible JSON data
- `created_at` (timestamptz)

**Indexes:**
- `idx_tracking_events_event_time` - For time-range queries
- `idx_tracking_events_partner_time` - Partner + time queries
- `idx_tracking_events_subsystem_time` - Sub-system + time queries
- `idx_tracking_events_event_type` - Event type filtering

## ⚡ Performance

- **Event Ingestion**: < 100ms p99
- **Report Queries**: < 500ms with proper indexes
- **Batch Processing**: Queue-based event collection
- **Optimized Queries**: Indexed on event_time, partner_id, sub_system_id
- **JSON Metadata**: PostgreSQL JSONB for flexible data storage

## 🧪 Testing

### Backend Tests
```bash
cd src/VolcanionTracking.Api.Tests
dotnet test
```

### Load Testing (Example)
```bash
# Using Apache Bench
ab -n 10000 -c 100 -H "X-Api-Key: your-key" \
  -p event.json \
  -T application/json \
  http://localhost:5000/api/v1/tracking/events
```

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture & design
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [admin-dashboard/TRACKING_SDK.md](admin-dashboard/TRACKING_SDK.md) - SDK documentation
- [database/README.md](database/README.md) - Database optimization
- API Documentation: http://localhost:5000/swagger

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Quick contribution steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: [Create an issue](https://github.com/volcanion-company/tracking-open-source/issues/new?template=bug_report.md)
- **Feature Requests**: [Create an issue](https://github.com/volcanion-company/tracking-open-source/issues/new?template=feature_request.md)
- **Questions**: [Start a discussion](https://github.com/volcanion-company/tracking-open-source/discussions)

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Multi-tenant architecture with Partners & Sub-Systems
- ✅ 43 predefined event types
- ✅ Admin dashboard with Next.js 15
- ✅ Reports with Chart.js (Bar & Line charts)
- ✅ Toggle chart types for event visualization
- ✅ Tracking SDK for Next.js with auto-tracking
- ✅ API Key authentication
- ✅ PostgreSQL with optimized indexes
- ✅ DateTime query fixes for accurate date ranges
- ✅ Data seeding script for testing

### Roadmap
- [ ] Rate limiting per API key
- [ ] Email notifications
- [ ] Role-based access control (RBAC)
- [ ] Export reports to CSV/Excel
- [ ] Real-time dashboard updates (WebSocket/SSE)
- [ ] Redis caching layer
- [ ] Multi-language support
- [ ] Dark mode for admin dashboard
- [ ] Mobile app (React Native)
- [ ] GraphQL API option

## 🔒 Security

- **API Key Hashing**: All API keys are hashed using PBKDF2 before storage
- **HTTPS**: Use HTTPS in production
- **CORS**: Configured CORS policies
- **Input Validation**: All inputs are validated
- **SQL Injection Protection**: EF Core parameterized queries

To report security vulnerabilities, please email security@volcanion.com (or create a private security advisory).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend**: ASP.NET Core Team
- **Frontend**: Next.js Team  
- **DevOps**: Infrastructure Team

## 🙏 Acknowledgments

- [ASP.NET Core](https://docs.microsoft.com/aspnet/core) - Web framework
- [Next.js](https://nextjs.org/) - React framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Material-UI](https://mui.com/) - UI components
- [Chart.js](https://www.chartjs.org/) - Charting library

## 📞 Support

- **Documentation**: This README and linked docs
- **Issues**: [GitHub Issues](https://github.com/volcanion-company/tracking-open-source/issues)
- **Discussions**: [GitHub Discussions](https://github.com/volcanion-company/tracking-open-source/discussions)
- **Email**: support@volcanion.com

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐️

---

**Made with ❤️ by Volcanion Company**
