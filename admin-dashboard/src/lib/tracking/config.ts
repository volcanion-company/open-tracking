/**
 * Volcanion Tracking SDK Configuration
 */

export interface TrackingConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  subSystemId: string;
  batchSize: number;
  batchInterval: number;
  debug: boolean;
}

export const trackingConfig: TrackingConfig = {
  enabled: process.env.NEXT_PUBLIC_TRACKING_ENABLED === 'true',
  apiUrl: process.env.NEXT_PUBLIC_TRACKING_API_URL || '',
  apiKey: process.env.NEXT_PUBLIC_TRACKING_API_KEY || '',
  subSystemId: process.env.NEXT_PUBLIC_TRACKING_SUB_SYSTEM_ID || '',
  batchSize: Number(process.env.NEXT_PUBLIC_TRACKING_BATCH_SIZE) || 10,
  batchInterval: Number(process.env.NEXT_PUBLIC_TRACKING_BATCH_INTERVAL) || 5000,
  debug: process.env.NEXT_PUBLIC_TRACKING_DEBUG === 'true',
};

export const isTrackingConfigured = (): boolean => {
  return !!(
    trackingConfig.enabled &&
    trackingConfig.apiUrl &&
    trackingConfig.apiKey &&
    trackingConfig.subSystemId
  );
};
