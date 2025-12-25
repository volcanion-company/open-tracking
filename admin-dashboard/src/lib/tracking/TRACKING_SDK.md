# Volcanion Tracking SDK

A powerful, type-safe tracking SDK for Next.js applications. Track user events, page views, errors, and performance metrics with automatic batching and resilient delivery.

## Features

- ✅ **Environment-based configuration** - All settings from `.env` variables
- ✅ **Automatic batching** - Queue events and send in configurable batches
- ✅ **Resilient delivery** - Uses `fetch` normally, `sendBeacon` on page unload
- ✅ **Auto-tracking** - Optional automatic tracking of clicks, forms, API calls, errors, performance
- ✅ **React integration** - Hooks and Provider for seamless usage
- ✅ **Session tracking** - Generates session IDs, includes rich metadata
- ✅ **Debug mode** - Configurable logging for development
- ✅ **TypeScript** - Full type safety throughout

## Installation

The SDK is already included in this project at `src/lib/tracking/`. No additional installation required.

## Quick Start

### 1. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Tracking Configuration
NEXT_PUBLIC_TRACKING_ENABLED=true
NEXT_PUBLIC_TRACKING_API_URL=http://localhost:5000/api/v1/tracking/events
NEXT_PUBLIC_TRACKING_API_KEY=your-tracking-api-key-here
NEXT_PUBLIC_TRACKING_SUB_SYSTEM_ID=your-subsystem-id-here
NEXT_PUBLIC_TRACKING_BATCH_SIZE=10
NEXT_PUBLIC_TRACKING_BATCH_INTERVAL=5000
NEXT_PUBLIC_TRACKING_DEBUG=false
```

**How to get API Key and Sub-System ID:**
1. Go to Admin Dashboard → Partners
2. Create or select a Partner
3. Go to Sub-Systems tab
4. Create or select a Sub-System
5. Go to API Keys tab
6. Generate a new API Key
7. Copy the API Key and Sub-System ID to `.env.local`

### 2. Wrap Your App with TrackingProvider

Edit `src/app/layout.tsx`:

```tsx
import { TrackingProvider } from '@/lib/tracking';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TrackingProvider>
          {children}
        </TrackingProvider>
      </body>
    </html>
  );
}
```

### 3. Start Tracking!

The SDK will automatically track:
- ✅ Page views on route changes
- ✅ Global errors and unhandled rejections

For manual tracking, see the [Usage](#usage) section below.

## Usage

### Automatic Page View Tracking

```tsx
'use client';
import { usePageTracking } from '@/lib/tracking';

export default function MyPage() {
  usePageTracking(); // Tracks page view on mount
  
  return <div>My Page</div>;
}
```

### Manual Event Tracking

```tsx
'use client';
import { useTracking } from '@/lib/tracking';

export default function MyComponent() {
  const { track } = useTracking();
  
  const handleSubmit = () => {
    track('FORM_SUBMITTED', {
      form: 'contact',
      fields: ['name', 'email']
    });
  };
  
  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Click Tracking

```tsx
'use client';
import { useClickTracking } from '@/lib/tracking';

export default function MyButton() {
  const handleClick = useClickTracking('submit_button');
  
  return <button onClick={handleClick}>Submit</button>;
}
```

### Error Tracking

```tsx
'use client';
import { useErrorTracking } from '@/lib/tracking';

export default function MyComponent() {
  useErrorTracking(); // Sets up global error listeners
  
  return <div>My Component</div>;
}
```

### Performance Tracking

```tsx
'use client';
import { usePerformanceTracking } from '@/lib/tracking';

export default function MyPage() {
  usePerformanceTracking(); // Tracks page load performance
  
  return <div>My Page</div>;
}
```

### Direct API Usage

For non-React code or server-side tracking:

```typescript
import { track, trackPageView, trackClick, trackError, trackApiCall, trackPerformance } from '@/lib/tracking';

// Track custom event
track('USER_SIGNUP', {
  plan: 'premium',
  source: 'homepage'
});

// Track page view
trackPageView('/about');

// Track click
trackClick('nav_menu', { item: 'pricing' });

// Track error
try {
  // ...
} catch (error) {
  trackError(error);
}

// Track API call
trackApiCall({
  method: 'POST',
  url: '/api/users',
  status: 201,
  duration: 234
});

// Track performance
trackPerformance({
  metric: 'page_load',
  value: 1234,
  unit: 'ms'
});
```

## Advanced Features

### Enable All Auto-Tracking

Track all user interactions automatically:

```typescript
import { enableAllAutoTracking } from '@/lib/tracking';

// Call this once in your app initialization
enableAllAutoTracking();
```

This will automatically track:
- **Clicks** on all buttons and links
- **Form submissions** with field names
- **API calls** (fetch/XMLHttpRequest intercept)
- **Tab visibility** changes
- **Page performance** metrics

### Individual Auto-Tracking

Enable specific auto-tracking features:

```typescript
import { 
  enableAutoClickTracking, 
  enableAutoFormTracking, 
  enableAutoApiTracking, 
  enableAutoVisibilityTracking,
  trackPagePerformance
} from '@/lib/tracking';

// Track all button/link clicks
enableAutoClickTracking();

// Track all form submissions
enableAutoFormTracking();

// Track all fetch/XMLHttpRequest calls
enableAutoApiTracking();

// Track tab visibility changes
enableAutoVisibilityTracking();

// Track page performance once
trackPagePerformance();
```

### Custom Configuration

Check if tracking is configured:

```typescript
import { isTrackingConfigured, trackingConfig } from '@/lib/tracking';

if (isTrackingConfigured()) {
  console.log('Tracking enabled:', trackingConfig.enabled);
  console.log('Batch size:', trackingConfig.batchSize);
}
```

## Event Types

The SDK supports 43 event types organized into 7 categories:

### File Operations
- `FILE_UPLOADED`, `FILE_DOWNLOADED`, `FILE_DELETED`, `FILE_MOVED`, `FILE_RENAMED`, `FILE_SHARED`, `FILE_ACCESSED`

### Hash Operations
- `HASH_GENERATED`, `HASH_VERIFIED`, `HASH_COMPARED`, `HASH_INVALID`, `HASH_UPDATED`, `HASH_LOOKUP_SUCCESS`, `HASH_LOOKUP_FAILED`

### System Operations
- `SYSTEM_STARTED`, `SYSTEM_STOPPED`, `SYSTEM_ERROR`, `SYSTEM_WARNING`, `SYSTEM_INFO`, `SYSTEM_HEALTH_CHECK`

### Storage Operations
- `STORAGE_READ`, `STORAGE_WRITE`, `STORAGE_DELETE`, `STORAGE_QUOTA_EXCEEDED`, `STORAGE_CLEARED`

### Security Operations
- `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_FAILED`, `AUTH_TOKEN_GENERATED`, `AUTH_TOKEN_EXPIRED`, `PERMISSION_DENIED`, `RATE_LIMIT_EXCEEDED`

### Monitoring Operations
- `MONITOR_CPU_HIGH`, `MONITOR_MEMORY_HIGH`, `MONITOR_DISK_FULL`, `MONITOR_NETWORK_ERROR`, `MONITOR_SERVICE_DOWN`

### Configuration Operations
- `CONFIG_UPDATED`, `CONFIG_LOADED`, `CONFIG_ERROR`, `CONFIG_RESET`, `CONFIG_EXPORTED`, `CONFIG_IMPORTED`

## API Reference

### TrackingEvent Interface

```typescript
interface TrackingEvent {
  partnerId: string;
  subSystemId: string;
  eventType: string;
  eventData?: Record<string, any>;
  eventTimestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

### Tracked Metadata

Each tracked event automatically includes:
- `url`: Current page URL
- `referrer`: Previous page URL
- `screenWidth`, `screenHeight`: Screen dimensions
- `userAgent`: Browser user agent
- `sessionId`: Unique session identifier (persists for browser session)

### Configuration Options

```typescript
interface TrackingConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  subSystemId: string;
  batchSize: number;      // Default: 10
  batchInterval: number;  // Default: 5000ms
  debug: boolean;         // Default: false
}
```

## Batching Strategy

The SDK queues events and sends them in batches to improve performance:

1. **Batch by size**: When queue reaches `batchSize` events
2. **Batch by time**: Every `batchInterval` milliseconds
3. **Page unload**: Immediately sends remaining events using `sendBeacon`

Benefits:
- Reduces network requests
- Improves page performance
- Ensures no events are lost on page navigation

## Debug Mode

Enable debug mode to see tracking logs in the console:

```bash
NEXT_PUBLIC_TRACKING_DEBUG=true
```

Debug logs include:
- Event tracking
- Batch sending
- API responses
- Configuration status

## Troubleshooting

### Events Not Sending

1. Check environment variables are set correctly
2. Verify API key is valid
3. Check backend API is running
4. Enable debug mode to see logs
5. Check browser network tab for failed requests

### TypeScript Errors

Make sure to run the Next.js app with TypeScript compiler:

```bash
npm run dev
```

### CORS Issues

If tracking requests are blocked by CORS, configure your backend API to allow requests from your frontend domain.

## Performance Considerations

- **Batching**: Events are queued and sent in batches (default: 10 events or 5 seconds)
- **Non-blocking**: Tracking never blocks UI interactions
- **sendBeacon**: Uses `sendBeacon` API for reliable delivery on page unload
- **Queue limit**: Maximum 100 events in queue (prevents memory leaks)

## Best Practices

1. **Use TrackingProvider**: Always wrap your app with `<TrackingProvider>`
2. **Track meaningful events**: Don't track every single interaction
3. **Include context**: Add relevant metadata to events
4. **Test in development**: Enable debug mode to verify tracking
5. **Monitor performance**: Check batch size and interval for your use case

## Examples

### E-commerce Tracking

```tsx
import { track } from '@/lib/tracking';

// Product view
track('FILE_ACCESSED', {
  productId: '123',
  category: 'electronics',
  price: 999
});

// Add to cart
track('STORAGE_WRITE', {
  action: 'add_to_cart',
  productId: '123',
  quantity: 1
});

// Purchase
track('SYSTEM_INFO', {
  orderId: 'ORD-456',
  total: 999,
  items: 1
});
```

### User Flow Tracking

```tsx
import { track } from '@/lib/tracking';

// Registration started
track('AUTH_TOKEN_GENERATED', {
  step: 'registration_started',
  source: 'homepage'
});

// Form step completed
track('SYSTEM_INFO', {
  step: 'personal_info_completed',
  fields: ['name', 'email']
});

// Registration completed
track('AUTH_LOGIN', {
  step: 'registration_completed',
  method: 'email'
});
```

## License

Internal use only - Volcanion Company

## Support

For issues or questions, contact the development team.
