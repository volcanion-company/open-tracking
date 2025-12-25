using Microsoft.EntityFrameworkCore;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public class TrackingEventRepository(VolcanionTrackingDbContext dbContext, ILogger<TrackingEventRepository> logger) : ITrackingEventRepository
{
    public async Task AddAsync(TrackingEvent trackingEvent)
    {
        await dbContext.TrackingEvents.AddAsync(trackingEvent);
        await dbContext.SaveChangesAsync();
    }

    public async Task BulkAddAsync(List<TrackingEvent> trackingEvents)
    {
        if (trackingEvents.Count == 0)
            return;

        await dbContext.TrackingEvents.AddRangeAsync(trackingEvents);
        await dbContext.SaveChangesAsync();
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Bulk inserted {Count} tracking events", trackingEvents.Count);
        }
    }

    public async Task<List<TrackingEvent>> GetByPartnerAsync(Guid partnerId, DateTime startDate, DateTime endDate)
    {
        // Ensure dates are UTC for PostgreSQL and cover full days
        var startUtc = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        
        logger.LogInformation("GetByPartnerAsync: partnerId={PartnerId}, startUtc={StartUtc}, endUtc={EndUtc}", 
            partnerId, startUtc, endUtc);
        
        var results = await dbContext.TrackingEvents
            .AsNoTracking()  // Read-only query optimization
            .Where(e => e.PartnerId == partnerId
                && e.EventTime >= startUtc
                && e.EventTime <= endUtc)
            .OrderByDescending(e => e.EventTime)  // DESC for better index usage
            .Take(10000)  // Limit result set
            .ToListAsync();
            
        logger.LogInformation("GetByPartnerAsync: Found {Count} events", results.Count);
        
        return results;
    }

    public async Task<List<TrackingEvent>> GetBySubSystemAsync(Guid subSystemId, DateTime startDate, DateTime endDate)
    {
        // Ensure dates are UTC for PostgreSQL and cover full days
        var startUtc = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        
        logger.LogInformation("GetBySubSystemAsync: subSystemId={SubSystemId}, startUtc={StartUtc}, endUtc={EndUtc}", 
            subSystemId, startUtc, endUtc);
        
        // First check if there are ANY events for this subsystem
        var totalCount = await dbContext.TrackingEvents
            .AsNoTracking()
            .Where(e => e.SubSystemId == subSystemId)
            .CountAsync();
            
        logger.LogInformation("GetBySubSystemAsync: Total events for subsystem (no date filter): {TotalCount}", totalCount);
        
        var results = await dbContext.TrackingEvents
            .AsNoTracking()
            .Where(e => e.SubSystemId == subSystemId
                && e.EventTime >= startUtc
                && e.EventTime <= endUtc)
            .OrderByDescending(e => e.EventTime)
            .Take(10000)
            .ToListAsync();
            
        logger.LogInformation("GetBySubSystemAsync: Found {Count} events in date range", results.Count);
        
        if (results.Count > 0)
        {
            logger.LogInformation("GetBySubSystemAsync: First event time={FirstEventTime}, Last event time={LastEventTime}",
                results.First().EventTime, results.Last().EventTime);
        }
        
        return results;
    }

    public async Task<long> GetCountByPartnerAsync(Guid partnerId, DateTime startDate, DateTime endDate)
    {
        var startUtc = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        
        return await dbContext.TrackingEvents
            .AsNoTracking()
            .Where(e => e.PartnerId == partnerId
                && e.EventTime >= startUtc
                && e.EventTime <= endUtc)
            .LongCountAsync();
    }

    public async Task<long> GetCountBySubSystemAsync(Guid subSystemId, DateTime startDate, DateTime endDate)
    {
        var startUtc = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        
        return await dbContext.TrackingEvents
            .AsNoTracking()
            .Where(e => e.SubSystemId == subSystemId
                && e.EventTime >= startUtc
                && e.EventTime <= endUtc)
            .LongCountAsync();
    }

    public async Task<Dictionary<string, long>> GetEventTypeCountsAsync(Guid subSystemId, DateTime startDate, DateTime endDate)
    {
        var startUtc = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        
        return await dbContext.TrackingEvents
            .AsNoTracking()
            .Where(e => e.SubSystemId == subSystemId
                && e.EventTime >= startUtc
                && e.EventTime <= endUtc)
            .GroupBy(e => e.EventType)
            .Select(g => new { EventType = g.Key, Count = g.LongCount() })
            .OrderByDescending(x => x.Count)  // Order by count
            .ToDictionaryAsync(x => x.EventType, x => x.Count);
    }
}
