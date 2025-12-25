using System.Text.Json.Serialization;

namespace VolcanionTracking.Client.Models;

public class TrackingEventRequest
{
    [JsonPropertyName("subSystemCode")]
    public string SubSystemCode { get; set; } = string.Empty;

    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("metadata")]
    public Dictionary<string, object>? Metadata { get; set; }
}

public class TrackingEventResponse
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("eventTime")]
    public DateTime EventTime { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public class BulkTrackingEventRequest
{
    [JsonPropertyName("events")]
    public List<TrackingEventRequest> Events { get; set; } = [];
}

public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("errors")]
    public List<string>? Errors { get; set; }
}
