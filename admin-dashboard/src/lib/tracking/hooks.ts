'use client';

import { useEffect, useRef } from 'react';
import { track, trackPageView, trackClick, trackError } from './client';

/**
 * Hook to track page views automatically
 */
export function usePageTracking() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      trackPageView();
      hasTracked.current = true;
    }
  }, []);
}

/**
 * Hook to track custom events
 */
export function useTracking() {
  return {
    track,
    trackPageView,
    trackClick,
    trackError,
  };
}

/**
 * Hook to track clicks on elements
 */
export function useClickTracking(elementName: string, metadata?: Record<string, any>) {
  return (event: React.MouseEvent) => {
    trackClick(elementName, {
      ...metadata,
      x: event.clientX,
      y: event.clientY,
    });
  };
}

/**
 * Hook to track errors automatically
 */
export function useErrorTracking() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'unhandledRejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceTracking() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        track('PERFORMANCE_METRIC', {
          metric: 'page_load',
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        });
      }
    }
  }, []);
}
