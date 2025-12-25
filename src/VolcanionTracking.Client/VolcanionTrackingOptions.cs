namespace VolcanionTracking.Client;

/// <summary>
/// Configuration options for Volcanion Tracking Client
/// </summary>
public class VolcanionTrackingOptions
{
    /// <summary>
    /// The base URL of the Volcanion Tracking API
    /// </summary>
    public string ApiUrl { get; set; } = "https://localhost:5000";

    /// <summary>
    /// The API key for authentication
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// The subsystem code for this application
    /// </summary>
    public string SubSystemCode { get; set; } = string.Empty;

    /// <summary>
    /// Enable automatic error retry (default: true)
    /// </summary>
    public bool EnableRetry { get; set; } = true;

    /// <summary>
    /// Maximum retry attempts (default: 3)
    /// </summary>
    public int MaxRetryAttempts { get; set; } = 3;

    /// <summary>
    /// Request timeout in seconds (default: 30)
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Enable buffering for offline scenarios (default: false)
    /// </summary>
    public bool EnableBuffering { get; set; } = false;

    /// <summary>
    /// Maximum buffer size when offline (default: 1000)
    /// </summary>
    public int MaxBufferSize { get; set; } = 1000;
}
