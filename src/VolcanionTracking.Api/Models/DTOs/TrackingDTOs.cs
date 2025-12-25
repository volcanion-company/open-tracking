namespace VolcanionTracking.Api.Models.DTOs;

public class TrackingEventRequest
{
    public string SubSystemCode { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public Dictionary<string, object>? Metadata { get; set; }
}

public class TrackingEventResponse
{
    public Guid Id { get; set; }
    public DateTime EventTime { get; set; }
    public string Status { get; set; } = "Queued";
}

public class BulkTrackingEventRequest
{
    public List<TrackingEventRequest> Events { get; set; } = [];
}
