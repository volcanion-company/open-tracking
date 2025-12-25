/**
 * Volcanion Tracking SDK - Main Export
 * 
 * @example
 * ```tsx
 * // 1. Wrap your app with TrackingProvider
 * import { TrackingProvider } from '@/lib/tracking';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <TrackingProvider>
 *       {children}
 *     </TrackingProvider>
 *   );
 * }
 * 
 * // 2. Use hooks in components
 * import { useTracking, usePageTracking } from '@/lib/tracking';
 * 
 * function MyComponent() {
 *   usePageTracking(); // Auto-track page view
 *   const { track } = useTracking();
 *   
 *   const handleClick = () => {
 *     track('BUTTON_CLICKED', { button: 'submit' });
 *   };
 * }
 * 
 * // 3. Track events manually
 * import { track, trackPageView, trackError } from '@/lib/tracking';
 * 
 * track('CUSTOM_EVENT', { foo: 'bar' });
 * trackPageView('/custom-path');
 * trackError(new Error('Something went wrong'));
 * ```
 */

// Core tracking client
export { default as VolcanionTracker, getTracker, track, trackPageView, trackClick, trackError, trackApiCall, trackPerformance } from './client';
export type { TrackingEvent, TrackedEvent } from './client';

// Configuration
export { trackingConfig, isTrackingConfigured } from './config';
export type { TrackingConfig } from './config';

// React components and hooks
export { TrackingProvider } from './TrackingProvider';
export { usePageTracking, useTracking, useClickTracking, useErrorTracking, usePerformanceTracking } from './hooks';

// Auto-tracking utilities
export { enableAutoClickTracking, enableAutoFormTracking, enableAutoApiTracking, enableAutoVisibilityTracking, trackPagePerformance, enableAllAutoTracking } from './auto-tracking';
