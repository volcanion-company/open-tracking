import httpClient from './httpClient';
import { PartnerStats, SubSystemStats, TimeSeriesData, EventCount, DashboardStats } from '@/types/models';

export interface PartnerReportResponse {
  partnerId: string;
  partnerName: string;
  totalEvents: number;
  topSubSystems: Array<{
    subSystemId: string;
    subSystemName: string;
    eventCount: number;
  }>;
  timeSeries: Array<{
    timestamp: string;
    count: number;
  }>;
}

export interface SubSystemReportResponse {
  subSystemId: string;
  subSystemName: string;
  totalEvents: number;
  eventsByType: Record<string, number>;
  timeSeries: Array<{
    timestamp: string;
    count: number;
  }>;
}

export class ReportApi {
  private readonly basePath = '/reports';

  // Get dashboard statistics (not implemented in backend yet)
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    // TODO: Backend endpoint not implemented yet
    // This will trigger the mock data fallback in the dashboard component
    throw new Error('Dashboard endpoint not implemented yet');
  }

  // Get partner statistics
  async getPartnerStats(
    partnerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PartnerStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    console.log('[ReportApi] Fetching partner stats:', { partnerId, startDate, endDate });

    const response = await httpClient.get<PartnerReportResponse>(
      `${this.basePath}/partners/${partnerId}?${params.toString()}`
    );

    console.log('[ReportApi] Partner response:', response);

    // Transform backend response to frontend format
    return {
      partnerId: response.partnerId,
      partnerName: response.partnerName,
      totalEvents: response.totalEvents,
      activeSubSystems: response.topSubSystems.length,
      topEventTypes: [], // Backend doesn't provide this in partner report
    };
  }

  // Get sub-system statistics
  async getSubSystemStats(
    subSystemId: string,
    startDate?: string,
    endDate?: string,
    eventType?: string
  ): Promise<SubSystemStats & { eventsByType: EventCount[]; timeSeries: TimeSeriesData[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (eventType) params.append('eventType', eventType);

    console.log('[ReportApi] Fetching sub-system stats:', { subSystemId, startDate, endDate, eventType });

    const response = await httpClient.get<SubSystemReportResponse>(
      `${this.basePath}/sub-systems/${subSystemId}?${params.toString()}`
    );

    console.log('[ReportApi] Sub-system response:', response);

    // Transform backend response to frontend format
    const eventsByType: EventCount[] = Object.entries(response.eventsByType).map(
      ([eventType, count]) => ({
        eventType,
        count,
      })
    );

    const timeSeries: TimeSeriesData[] = response.timeSeries.map((item) => ({
      date: item.timestamp,
      count: item.count,
    }));

    return {
      subSystemId: response.subSystemId,
      subSystemName: response.subSystemName,
      eventCount: response.totalEvents,
      eventsByType,
      timeSeries,
    };
  }

  // Get time series data for partner
  async getTimeSeries(
    partnerId: string,
    subSystemId?: string,
    startDate?: string,
    endDate?: string,
    interval?: 'hour' | 'day' | 'week' | 'month'
  ): Promise<TimeSeriesData[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    console.log('[ReportApi] Fetching time series:', { partnerId, startDate, endDate });

    const response = await httpClient.get<PartnerReportResponse>(
      `${this.basePath}/partners/${partnerId}?${params.toString()}`
    );

    console.log('[ReportApi] Time series response:', response);

    // Transform backend response to frontend format
    return response.timeSeries.map((item) => ({
      date: item.timestamp,
      count: item.count,
    }));
  }

  // Get time series data for sub-system
  async getSubSystemTimeSeries(
    subSystemId: string,
    startDate?: string,
    endDate?: string,
    eventType?: string
  ): Promise<TimeSeriesData[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (eventType) params.append('eventType', eventType);

    const response = await httpClient.get<SubSystemReportResponse>(
      `${this.basePath}/sub-systems/${subSystemId}?${params.toString()}`
    );

    // Transform backend response to frontend format
    return response.timeSeries.map((item) => ({
      date: item.timestamp,
      count: item.count,
    }));
  }
}

export const reportApi = new ReportApi();
export default reportApi;
