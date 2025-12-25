import httpClient from './httpClient';
import { 
  TrackingEvent, 
  DashboardStats, 
  PartnerStats,
  SubSystemStats,
  TimeSeriesData,
  EventCount 
} from '@/types/models';

export interface TrackingEventDto {
  subSystemCode: string;
  eventType: string;
  metadata?: Record<string, any>;
}

export interface GetEventsParams {
  partnerId?: string;
  subSystemId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export class TrackingApi {
  private readonly basePath = '/tracking';

  // Track event (for testing purposes in admin)
  async trackEvent(data: TrackingEventDto, apiKey: string): Promise<void> {
    return httpClient.post<void>(`${this.basePath}/track`, data, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });
  }

  // Get events
  async getEvents(params: GetEventsParams): Promise<TrackingEvent[]> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return httpClient.get<TrackingEvent[]>(`${this.basePath}/events?${queryString}`);
  }

  // Get event by ID
  async getEventById(id: string): Promise<TrackingEvent> {
    return httpClient.get<TrackingEvent>(`${this.basePath}/events/${id}`);
  }
}

export const trackingApi = new TrackingApi();
