namespace VolcanionTracking.Api.Models.DTOs;

public class ReportRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? EventType { get; set; }
}

public class SubSystemReportResponse
{
    public Guid SubSystemId { get; set; }
    public string SubSystemName { get; set; } = string.Empty;
    public long TotalEvents { get; set; }
    public Dictionary<string, long> EventsByType { get; set; } = [];
    public List<TimeSeriesData> TimeSeries { get; set; } = [];
}

public class PartnerReportResponse
{
    public Guid PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public long TotalEvents { get; set; }
    public List<SubSystemSummary> TopSubSystems { get; set; } = [];
    public List<TimeSeriesData> TimeSeries { get; set; } = [];
}

public class SubSystemSummary
{
    public Guid SubSystemId { get; set; }
    public string SubSystemName { get; set; } = string.Empty;
    public long EventCount { get; set; }
}

public class TimeSeriesData
{
    public DateTime Timestamp { get; set; }
    public long Count { get; set; }
}

public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
