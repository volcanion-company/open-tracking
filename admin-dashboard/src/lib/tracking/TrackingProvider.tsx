'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, getTracker } from './client';
import { isTrackingConfigured } from './config';

interface TrackingProviderProps {
  children: React.ReactNode;
}

/**
 * Tracking Provider Component
 * Wraps the app to enable automatic tracking
 */
export function TrackingProvider({ children }: TrackingProviderProps) {
  const pathname = usePathname();

  // Track page views on route change
  useEffect(() => {
    if (isTrackingConfigured()) {
      trackPageView(pathname);
    }
  }, [pathname]);

  // Track global errors
  useEffect(() => {
    if (!isTrackingConfigured()) return;

    const handleError = (event: ErrorEvent) => {
      getTracker().trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        pathname,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      getTracker().trackError(new Error(`Unhandled Promise: ${event.reason}`), {
        type: 'unhandledRejection',
        pathname,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTrackingConfigured()) {
        getTracker().destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
