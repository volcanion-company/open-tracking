/**
 * Volcanion Tracking SDK - Core Client
 */

import { trackingConfig, isTrackingConfigured } from './config';

export interface TrackingEvent {
  eventType: string;
  metadata?: Record<string, any>;
}

export interface TrackedEvent extends TrackingEvent {
  timestamp: string;
  userAgent: string;
  url: string;
  referrer: string;
  screenWidth: number;
  screenHeight: number;
}

class VolcanionTracker {
  private queue: TrackedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    if (typeof window !== 'undefined' && isTrackingConfigured()) {
      this.startAutoFlush();
      this.setupBeforeUnload();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(...args: any[]): void {
    if (trackingConfig.debug) {
      console.log('[VolcanionTracker]', ...args);
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, trackingConfig.batchInterval);
  }

  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        this.flush(true); // Synchronous flush on unload
      }
    });
  }

  /**
   * Track a custom event
   */
  public track(eventType: string, metadata?: Record<string, any>): void {
    if (!isTrackingConfigured()) {
      this.log('Tracking not configured, skipping event:', eventType);
      return;
    }

    if (!trackingConfig.enabled) {
      this.log('Tracking disabled, skipping event:', eventType);
      return;
    }

    const event: TrackedEvent = {
      eventType,
      metadata: {
        ...metadata,
        sessionId: this.sessionId,
      },
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    };

    this.queue.push(event);
    this.log('Event queued:', eventType, `(${this.queue.length}/${trackingConfig.batchSize})`);

    // Auto flush when batch size reached
    if (this.queue.length >= trackingConfig.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to server
   */
  public async flush(sync: boolean = false): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    this.log(`Flushing ${events.length} events...`);

    const payload = events.map((event) => ({
      subSystemId: trackingConfig.subSystemId,
      eventType: event.eventType,
      eventTime: event.timestamp,
      userAgent: event.userAgent,
      ip: '', // IP will be captured by server
      metadata: {
        url: event.url,
        referrer: event.referrer,
        screenWidth: event.screenWidth,
        screenHeight: event.screenHeight,
        ...event.metadata,
      },
    }));

    try {
      if (sync && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        // Use sendBeacon for synchronous sends (on page unload)
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(trackingConfig.apiUrl, blob);
        this.log('Events sent via sendBeacon');
      } else {
        // Use fetch for normal async sends
        const response = await fetch(trackingConfig.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': trackingConfig.apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.log(`Successfully sent ${events.length} events`);
      }
    } catch (error) {
      this.log('Failed to send events:', error);
      // Re-queue failed events
      this.queue.unshift(...events);
    }
  }

  /**
   * Track page view
   */
  public trackPageView(path?: string): void {
    this.track('USER_SESSION_START', {
      path: path || (typeof window !== 'undefined' ? window.location.pathname : ''),
      title: typeof document !== 'undefined' ? document.title : '',
    });
  }

  /**
   * Track click event
   */
  public trackClick(element: string, metadata?: Record<string, any>): void {
    this.track('API_REQUEST', {
      element,
      ...metadata,
    });
  }

  /**
   * Track error
   */
  public trackError(error: Error, metadata?: Record<string, any>): void {
    this.track('SYSTEM_ALERT', {
      error: error.message,
      stack: error.stack,
      ...metadata,
    });
  }

  /**
   * Track API call
   */
  public trackApiCall(endpoint: string, method: string, status: number, duration: number): void {
    this.track('API_REQUEST', {
      endpoint,
      method,
      status,
      duration,
    });
  }

  /**
   * Track performance metric
   */
  public trackPerformance(metric: string, value: number, metadata?: Record<string, any>): void {
    this.track('PERFORMANCE_METRIC', {
      metric,
      value,
      ...metadata,
    });
  }

  /**
   * Destroy tracker and cleanup
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
  }
}

// Singleton instance
let trackerInstance: VolcanionTracker | null = null;

export const getTracker = (): VolcanionTracker => {
  if (!trackerInstance) {
    trackerInstance = new VolcanionTracker();
  }
  return trackerInstance;
};

// Convenience exports
export const track = (eventType: string, metadata?: Record<string, any>): void => {
  getTracker().track(eventType, metadata);
};

export const trackPageView = (path?: string): void => {
  getTracker().trackPageView(path);
};

export const trackClick = (element: string, metadata?: Record<string, any>): void => {
  getTracker().trackClick(element, metadata);
};

export const trackError = (error: Error, metadata?: Record<string, any>): void => {
  getTracker().trackError(error, metadata);
};

export const trackApiCall = (endpoint: string, method: string, status: number, duration: number): void => {
  getTracker().trackApiCall(endpoint, method, status, duration);
};

export const trackPerformance = (metric: string, value: number, metadata?: Record<string, any>): void => {
  getTracker().trackPerformance(metric, value, metadata);
};

export default VolcanionTracker;
