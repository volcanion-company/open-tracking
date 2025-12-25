using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public interface ITrackingEventRepository
{
    Task AddAsync(TrackingEvent trackingEvent);
    Task BulkAddAsync(List<TrackingEvent> trackingEvents);
    Task<List<TrackingEvent>> GetByPartnerAsync(Guid partnerId, DateTime startDate, DateTime endDate);
    Task<List<TrackingEvent>> GetBySubSystemAsync(Guid subSystemId, DateTime startDate, DateTime endDate);
    Task<long> GetCountByPartnerAsync(Guid partnerId, DateTime startDate, DateTime endDate);
    Task<long> GetCountBySubSystemAsync(Guid subSystemId, DateTime startDate, DateTime endDate);
    Task<Dictionary<string, long>> GetEventTypeCountsAsync(Guid subSystemId, DateTime startDate, DateTime endDate);
}
