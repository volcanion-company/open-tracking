using System.Text.Json;
using System.Threading.Channels;
using VolcanionTracking.Api.Data.Repositories;
using VolcanionTracking.Api.Models.DTOs;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Services;

public interface ITrackingService
{
    Task<TrackingEventResponse> EnqueueEventAsync(Guid partnerId, TrackingEventRequest request, string ip, string userAgent);
    Task<List<TrackingEventResponse>> EnqueueBulkEventsAsync(Guid partnerId, BulkTrackingEventRequest request, string ip, string userAgent);
}

public class TrackingService(
    ISubSystemRepository subSystemRepository,
    Channel<TrackingEvent> eventChannel,
    ILogger<TrackingService> logger) : ITrackingService
{
    public async Task<TrackingEventResponse> EnqueueEventAsync(Guid partnerId, TrackingEventRequest request, string ip, string userAgent)
    {
        // Validate subsystem belongs to partner by code
        var subSystem = await subSystemRepository.GetByCodeAsync(partnerId, request.SubSystemCode) ?? throw new InvalidOperationException($"SubSystem with code '{request.SubSystemCode}' not found for partner {partnerId}");

        var trackingEvent = new TrackingEvent
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId,
            SubSystemId = subSystem.Id,
            EventTime = DateTime.UtcNow,
            EventType = request.EventType,
            Metadata = request.Metadata != null ? JsonSerializer.Serialize(request.Metadata) : "{}",
            Ip = ip,
            UserAgent = userAgent
        };

        // Enqueue to channel for background processing
        await eventChannel.Writer.WriteAsync(trackingEvent);

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Enqueued tracking event {EventId} for partner {PartnerId}", trackingEvent.Id, partnerId);
        }

        return new TrackingEventResponse
        {
            Id = trackingEvent.Id,
            EventTime = trackingEvent.EventTime,
            Status = "Queued"
        };
    }

    public async Task<List<TrackingEventResponse>> EnqueueBulkEventsAsync(Guid partnerId, BulkTrackingEventRequest request, string ip, string userAgent)
    {
        var responses = new List<TrackingEventResponse>();

        foreach (var evt in request.Events)
        {
            try
            {
                var response = await EnqueueEventAsync(partnerId, evt, ip, userAgent);
                responses.Add(response);
            }
            catch (Exception ex)
            {
                if (logger.IsEnabled(LogLevel.Error))
                {
                    logger.LogError(ex, "Error enqueuing event for subsystem {SubSystemCode}", evt.SubSystemCode);
                }
                responses.Add(new TrackingEventResponse
                {
                    Id = Guid.Empty,
                    EventTime = DateTime.UtcNow,
                    Status = $"Error: {ex.Message}"
                });
            }
        }

        return responses;
    }
}
