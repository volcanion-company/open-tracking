using VolcanionTracking.Api.Data.Repositories;
using VolcanionTracking.Api.Models.DTOs;

namespace VolcanionTracking.Api.Services;

public interface IReportService
{
    Task<SubSystemReportResponse> GetSubSystemReportAsync(Guid subSystemId, ReportRequest request);
    Task<PartnerReportResponse> GetPartnerReportAsync(Guid partnerId, ReportRequest request);
}

public class ReportService(
    ITrackingEventRepository trackingEventRepository,
    ISubSystemRepository subSystemRepository,
    IPartnerRepository partnerRepository,
    ICachingService cachingService) : IReportService
{
    public async Task<SubSystemReportResponse> GetSubSystemReportAsync(Guid subSystemId, ReportRequest request)
    {
        var cacheKey = $"report:subsystem:{subSystemId}:{request.StartDate:yyyyMMdd}:{request.EndDate:yyyyMMdd}";
        var cached = await cachingService.GetAsync<SubSystemReportResponse>(cacheKey);
        if (cached != null)
            return cached;

        var subSystem = await subSystemRepository.GetByIdAsync(subSystemId) ?? throw new InvalidOperationException($"SubSystem {subSystemId} not found");
        var events = await trackingEventRepository.GetBySubSystemAsync(subSystemId, request.StartDate, request.EndDate);

        // Filter by event type if specified
        if (!string.IsNullOrEmpty(request.EventType))
        {
            events = [.. events.Where(e => e.EventType == request.EventType)];
        }

        // Calculate event counts by type
        var eventsByType = events
            .GroupBy(e => e.EventType)
            .ToDictionary(g => g.Key, g => (long)g.Count());

        // Calculate time series data (hourly aggregation)
        var timeSeries = events
            .GroupBy(e => new DateTime(e.EventTime.Year, e.EventTime.Month, e.EventTime.Day, e.EventTime.Hour, 0, 0))
            .Select(g => new TimeSeriesData
            {
                Timestamp = g.Key,
                Count = g.Count()
            })
            .OrderBy(t => t.Timestamp)
            .ToList();

        var response = new SubSystemReportResponse
        {
            SubSystemId = subSystemId,
            SubSystemName = subSystem.Name,
            TotalEvents = events.Count,
            EventsByType = eventsByType,
            TimeSeries = timeSeries
        };

        // Cache for 5 minutes
        await cachingService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return response;
    }

    public async Task<PartnerReportResponse> GetPartnerReportAsync(Guid partnerId, ReportRequest request)
    {
        var cacheKey = $"report:partner:{partnerId}:{request.StartDate:yyyyMMdd}:{request.EndDate:yyyyMMdd}";
        var cached = await cachingService.GetAsync<PartnerReportResponse>(cacheKey);
        if (cached != null)
            return cached;

        var partner = await partnerRepository.GetByIdAsync(partnerId) ?? throw new InvalidOperationException($"Partner {partnerId} not found");
        var events = await trackingEventRepository.GetByPartnerAsync(partnerId, request.StartDate, request.EndDate);

        // Get all subsystems for this partner
        var subSystems = await subSystemRepository.GetByPartnerIdAsync(partnerId);

        // Calculate top subsystems by event count
        var topSubSystems = events
            .GroupBy(e => e.SubSystemId)
            .Select(g => new
            {
                SubSystemId = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .Select(x => new SubSystemSummary
            {
                SubSystemId = x.SubSystemId,
                SubSystemName = subSystems.FirstOrDefault(s => s.Id == x.SubSystemId)?.Name ?? "Unknown",
                EventCount = x.Count
            })
            .ToList();

        // Calculate time series data (daily aggregation for partner level)
        var timeSeries = events
            .GroupBy(e => new DateTime(e.EventTime.Year, e.EventTime.Month, e.EventTime.Day))
            .Select(g => new TimeSeriesData
            {
                Timestamp = g.Key,
                Count = g.Count()
            })
            .OrderBy(t => t.Timestamp)
            .ToList();

        var response = new PartnerReportResponse
        {
            PartnerId = partnerId,
            PartnerName = partner.Name,
            TotalEvents = events.Count,
            TopSubSystems = topSubSystems,
            TimeSeries = timeSeries
        };

        // Cache for 5 minutes
        await cachingService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return response;
    }
}
