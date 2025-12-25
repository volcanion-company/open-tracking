/**
 * Volcanion Tracking SDK
 * Auto-tracking utilities for common events
 */

import { getTracker } from './client';

/**
 * Auto-track all clicks in the application
 */
export function enableAutoClickTracking(selector: string = 'button, a, [role="button"]'): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const element = target.closest(selector);

    if (element) {
      const elementName = 
        element.getAttribute('data-track-name') ||
        element.getAttribute('aria-label') ||
        element.textContent?.trim() ||
        element.tagName.toLowerCase();

      getTracker().track('SYSTEM_INFO', {
        action: 'click',
        element: elementName,
        href: element.getAttribute('href'),
        id: element.id,
        className: element.className,
        x: event.clientX,
        y: event.clientY,
      });
    }
  }, true);
}

/**
 * Auto-track form submissions
 */
export function enableAutoFormTracking(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    const formName = form.getAttribute('name') || form.id || 'unnamed-form';

    getTracker().track('SYSTEM_INFO', {
      action: 'form_submit',
      formName,
      formAction: form.action,
      formMethod: form.method,
    });
  }, true);
}

/**
 * Auto-track API calls by intercepting fetch
 */
export function enableAutoApiTracking(): void {
  if (typeof window === 'undefined' || !window.fetch) return;

  const originalFetch = window.fetch;

  window.fetch = async function(...args: Parameters<typeof fetch>) {
    const [resource, config] = args;
    const url = typeof resource === 'string' 
      ? resource 
      : resource instanceof Request 
        ? resource.url 
        : resource.href;
    const method = config?.method || 'GET';
    const startTime = performance.now();

    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;

      getTracker().trackApiCall(url, method, response.status, duration);

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      getTracker().trackApiCall(url, method, 0, duration);
      throw error;
    }
  };
}

/**
 * Auto-track visibility changes (tab switching)
 */
export function enableAutoVisibilityTracking(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    getTracker().track(document.hidden ? 'SYSTEM_INFO' : 'SYSTEM_INFO', {
      action: document.hidden ? 'tab_hidden' : 'tab_visible',
      hidden: document.hidden,
    });
  });
}

/**
 * Auto-track page performance metrics
 */
export function trackPagePerformance(): void {
  if (typeof window === 'undefined' || !window.performance) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        getTracker().trackPerformance('page_load', navigation.loadEventEnd - navigation.fetchStart, {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          domComplete: navigation.domComplete - navigation.fetchStart,
        });
      }

      // Track paint metrics
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        getTracker().trackPerformance(entry.name, entry.startTime);
      });

      // Track resource metrics
      const resources = performance.getEntriesByType('resource');
      const resourceStats = {
        action: 'resource_timing',
        totalResources: resources.length,
        scripts: resources.filter(r => (r as PerformanceResourceTiming).initiatorType === 'script').length,
        styles: resources.filter(r => (r as PerformanceResourceTiming).initiatorType === 'link').length,
        images: resources.filter(r => (r as PerformanceResourceTiming).initiatorType === 'img').length,
      };
      
      getTracker().track('SYSTEM_INFO', resourceStats);
    }, 0);
  });
}

/**
 * Enable all auto-tracking features
 */
export function enableAllAutoTracking(): void {
  enableAutoClickTracking();
  enableAutoFormTracking();
  enableAutoApiTracking();
  enableAutoVisibilityTracking();
  trackPagePerformance();
}
