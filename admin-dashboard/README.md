# Volcanion Tracking Admin Dashboard

Modern admin dashboard for Volcanion Tracking System built with Next.js 15, TypeScript, and Material-UI.

## 🎯 Features

### Dashboard
- **Real-time Statistics** - Total events, partners, sub-systems
- **Interactive Charts** - Line charts for time-series, doughnut charts for event distribution
- **Top Lists** - Top partners and sub-systems by event count

### Reports
- **Partner Reports** - Detailed analytics per partner with event trends
- **Sub-System Reports** - Performance metrics and event type breakdown
- **Date Range Filtering** - Analyze data for specific time periods
- **Export Ready** - Data formatted for easy export

### Settings
- **Partner Management** - CRUD operations for partners
- **API Key Management** - Generate, regenerate, and revoke API keys
- **Sub-System Management** - Configure and manage sub-systems
- **Status Control** - Activate/deactivate entities

### Architecture
- **Layered Architecture** - Separation of UI, API, and domain layers
- **Auth Ready** - Context and guards prepared for authentication
- **Type Safe** - Full TypeScript coverage
- **Responsive** - Mobile-first design with MUI components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Volcanion Tracking API running (default: http://localhost:5000)

### Installation

```bash
cd admin-dashboard
npm install
```

### Configuration

1. Copy environment template:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_TIMEOUT=30000

# Feature Flags
NEXT_PUBLIC_ENABLE_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── dashboard/            # Dashboard page
│   │   ├── reports/              # Report pages
│   │   │   ├── partners/         # Partner reports
│   │   │   └── sub-systems/      # Sub-system reports
│   │   ├── settings/             # Settings pages
│   │   │   ├── partners/         # Partner management
│   │   │   └── sub-systems/      # Sub-system management
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page (redirects to dashboard)
│   │
│   ├── components/               # React components
│   │   ├── auth/                 # Auth guards (RequireAuth, RequirePermission)
│   │   ├── common/               # Shared components (Loading, Empty, Error)
│   │   ├── layout/               # Layout components (DashboardLayout, Sidebar)
│   │   └── providers/            # Context providers (Theme, Auth)
│   │
│   ├── api/                      # API client layer
│   │   ├── httpClient.ts         # Axios instance with interceptors
│   │   ├── partner.api.ts        # Partner API calls
│   │   ├── subsystem.api.ts      # Sub-system API calls
│   │   ├── tracking.api.ts       # Tracking & reporting API calls
│   │   └── index.ts              # API exports
│   │
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.tsx       # Authentication context
│   │
│   ├── types/                    # TypeScript types
│   │   └── models.ts             # Domain models and DTOs
│   │
│   └── config/                   # Configuration
│       └── index.ts              # Environment config
│
├── public/                       # Static assets
├── .env.local                    # Environment variables (create from .example)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## 🏗️ Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│         UI Layer (Pages)            │
│  - Dashboard, Reports, Settings     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Component Layer                │
│  - Layout, Common, Auth Guards      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       API Client Layer              │
│  - HTTP Client with Interceptors    │
│  - Type-safe API methods            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Domain Model Layer             │
│  - TypeScript interfaces            │
│  - DTOs and API contracts           │
└─────────────────────────────────────┘
```

### API Client Design

The API layer is designed with:

1. **HTTP Client** - Axios instance with request/response interceptors
2. **Token Management** - Automatic token injection (ready for auth)
3. **Error Handling** - Global error transformation
4. **Type Safety** - Full TypeScript types for requests/responses
5. **Refresh Token** - Token refresh logic prepared (commented out)

Example:
```typescript
// API call is simple and type-safe
const partners = await partnerApi.getAll();

// Error handling is automatic
try {
  await partnerApi.create(data);
} catch (error: ApiError) {
  console.error(error.message, error.statusCode);
}
```

### Authentication (Prepared, Not Enabled)

The application is ready for authentication:

```typescript
// AuthContext provides auth state
const { user, isAuthenticated, login, logout } = useAuth();

// RequireAuth component protects routes
<RequireAuth roles={['Admin']}>
  <ProtectedPage />
</RequireAuth>

// RequirePermission for granular control
<RequirePermission permission="partners.create">
  <CreateButton />
</RequirePermission>
```

To enable auth:
1. Set `NEXT_PUBLIC_ENABLE_AUTH=true` in `.env.local`
2. Implement login API in `AuthContext`
3. Uncomment token refresh logic in `httpClient.ts`

### Role-Based Access Control (RBAC)

Three roles defined:
- **Admin** - Full access to all features
- **PartnerAdmin** - Manage own partner data (view only for others)
- **Viewer** - Read-only access

## 🎨 UI Components

### Material-UI Theme

Custom theme with:
- Primary color: `#1976d2` (blue)
- Secondary color: `#dc004e` (red)
- Typography: Inter font family
- Custom component styles (buttons, cards, etc.)

### Charts

Using Chart.js with React wrappers:
- **Line Charts** - Time-series data
- **Bar Charts** - Event type distribution
- **Doughnut Charts** - Percentage breakdowns

### Responsive Design

- Desktop-first approach
- Collapsible sidebar
- Mobile-optimized tables
- Responsive grid layouts

## 🔌 API Integration

### Endpoints Used

**Partners:**
- `GET /api/v1/partners` - List all partners
- `GET /api/v1/partners/{id}` - Get partner by ID
- `GET /api/v1/partners/by-code/{code}` - Get partner by code
- `POST /api/v1/partners` - Create partner
- `PUT /api/v1/partners/{id}` - Update partner
- `DELETE /api/v1/partners/{id}` - Delete partner

**API Keys:**
- `GET /api/v1/partners/{id}/api-keys` - List API keys
- `POST /api/v1/partners/{id}/api-keys` - Create API key
- `POST /api/v1/partners/{id}/api-keys/{keyId}/regenerate` - Regenerate key
- `DELETE /api/v1/partners/{id}/api-keys/{keyId}` - Revoke key

**Sub-Systems:**
- `GET /api/v1/sub-systems` - List all sub-systems
- `GET /api/v1/sub-systems/{id}` - Get sub-system by ID
- `POST /api/v1/sub-systems` - Create sub-system
- `PUT /api/v1/sub-systems/{id}` - Update sub-system
- `DELETE /api/v1/sub-systems/{id}` - Delete sub-system

**Reports:**
- `GET /api/v1/reports/dashboard` - Dashboard statistics
- `GET /api/v1/reports/partner` - Partner statistics
- `GET /api/v1/reports/subsystem` - Sub-system statistics
- `GET /api/v1/reports/timeseries` - Time-series data
- `GET /api/v1/reports/event-types` - Event type distribution
- `GET /api/v1/reports/top-subsystems` - Top sub-systems

### Mock Data Fallback

If API calls fail, the dashboard uses mock data for development:
- Allows UI testing without backend
- Simulates realistic data patterns
- Remove in production by checking error handling

## 🛠️ Development

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Next.js recommended rules
- **Naming** - camelCase for variables, PascalCase for components
- **File Structure** - Feature-based organization

### Adding New Features

1. **Create API method** in `src/api/`
2. **Define types** in `src/types/models.ts`
3. **Create page** in `src/app/`
4. **Add to navigation** in `DashboardLayout.tsx`

Example - Adding a new report:

```typescript
// 1. Add API method
export class ReportApi {
  async getCustomReport(): Promise<CustomReport> {
    return httpClient.get<CustomReport>('/reports/custom');
  }
}

// 2. Define types
export interface CustomReport {
  metric: number;
  data: any[];
}

// 3. Create page
// src/app/reports/custom/page.tsx
export default function CustomReportPage() {
  const [data, setData] = useState<CustomReport | null>(null);
  
  useEffect(() => {
    reportApi.getCustomReport().then(setData);
  }, []);
  
  return <div>{/* Render report */}</div>;
}

// 4. Add navigation item in DashboardLayout.tsx
{
  title: 'Custom Report',
  path: '/reports/custom',
  icon: <CustomIcon />
}
```

### State Management

Currently using React hooks (`useState`, `useEffect`) for simplicity.

For complex state, consider:
- **Zustand** - Already installed, lightweight state management
- **React Query** - For server state caching
- **Context API** - For global UI state

### Performance Optimization

- **Code Splitting** - Automatic with Next.js App Router
- **Image Optimization** - Use Next.js `<Image>` component
- **Lazy Loading** - Load charts only when needed
- **Memoization** - Use `useMemo` for expensive computations
- **Debouncing** - Implement for search/filter inputs

## 📦 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t volcanion-admin .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://api:5000/api/v1 volcanion-admin
```

### Environment Variables

Production environment:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.production.com/api/v1
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

## 🔐 Security Considerations

### Current State (No Auth)

- No authentication required
- All API endpoints accessible
- Suitable for internal networks only

### Future Auth Implementation

When enabling auth:

1. **JWT Tokens** - Store in httpOnly cookies (not localStorage for production)
2. **HTTPS Only** - Enforce SSL in production
3. **API Key Protection** - Never expose in client code
4. **CORS** - Configure backend CORS policies
5. **XSS Protection** - Sanitize user inputs
6. **CSRF Protection** - Implement CSRF tokens

## 🧪 Testing

### Setup Testing (Future)

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

Test structure:
```
src/
├── __tests__/
│   ├── components/
│   ├── api/
│   └── pages/
```

## 📝 Roadmap

### Phase 1 (Current) ✅
- [x] Basic dashboard
- [x] Partner & sub-system management
- [x] Reports with charts
- [x] API integration
- [x] Auth structure (not enabled)

### Phase 2 (Next)
- [ ] Enable authentication
- [ ] Real-time updates (WebSocket/SSE)
- [ ] Advanced filtering
- [ ] Data export (CSV, Excel)
- [ ] User management

### Phase 3 (Future)
- [ ] Multi-language support (i18n)
- [ ] Dark mode
- [ ] Audit logs
- [ ] Advanced analytics (ML insights)
- [ ] Mobile app (React Native)

## 🐛 Troubleshooting

### API Connection Issues

```bash
# Check API is running
curl http://localhost:5000/api/v1/partners

# Check CORS settings in backend
# Ensure frontend URL is whitelisted
```

### Build Errors

```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Type Errors

```bash
# Regenerate types
npm run type-check

# Update TypeScript
npm install --save-dev typescript@latest
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Axios Documentation](https://axios-http.com/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Private - Volcanion Company

---

**Built with ❤️ by Volcanion Team**
