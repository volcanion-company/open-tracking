using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VolcanionTracking.Client.Models;

namespace VolcanionTracking.Client;

/// <summary>
/// Client interface for Volcanion Tracking API
/// </summary>
public interface IVolcanionTrackingClient
{
    /// <summary>
    /// Track a single event
    /// </summary>
    Task<TrackingEventResponse?> TrackAsync(string eventType, Dictionary<string, object>? metadata = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Track multiple events in bulk
    /// </summary>
    Task<List<TrackingEventResponse>> TrackBulkAsync(List<(string EventType, Dictionary<string, object>? Metadata)> events, CancellationToken cancellationToken = default);

    /// <summary>
    /// Track a single event (fire and forget - no await)
    /// </summary>
    void Track(string eventType, Dictionary<string, object>? metadata = null);
}

/// <summary>
/// Implementation of Volcanion Tracking Client
/// </summary>
public class VolcanionTrackingClient : IVolcanionTrackingClient
{
    private readonly HttpClient _httpClient;
    private readonly VolcanionTrackingOptions _options;
    private readonly ILogger<VolcanionTrackingClient> _logger;
    private readonly Queue<TrackingEventRequest> _buffer = new();
    private readonly SemaphoreSlim _bufferLock = new(1, 1);

    public VolcanionTrackingClient(
        HttpClient httpClient,
        IOptions<VolcanionTrackingOptions> options,
        ILogger<VolcanionTrackingClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;

        // Configure HttpClient
        _httpClient.BaseAddress = new Uri(_options.ApiUrl);
        _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _options.ApiKey);
        _httpClient.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
    }

    public async Task<TrackingEventResponse?> TrackAsync(
        string eventType,
        Dictionary<string, object>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        var request = new TrackingEventRequest
        {
            SubSystemCode = _options.SubSystemCode,
            EventType = eventType,
            Metadata = metadata
        };

        var retryCount = 0;
        Exception? lastException = null;

        while (retryCount <= (_options.EnableRetry ? _options.MaxRetryAttempts : 0))
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/api/v1/tracking", request, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<TrackingEventResponse>>(cancellationToken);
                    
                    if (apiResponse?.Success == true && apiResponse.Data != null)
                    {
                        _logger.LogDebug("Event tracked successfully: {EventType}", eventType);
                        return apiResponse.Data;
                    }
                }

                _logger.LogWarning("Failed to track event: {StatusCode}", response.StatusCode);
                lastException = new HttpRequestException($"API returned {response.StatusCode}");
            }
            catch (Exception ex)
            {
                lastException = ex;
                _logger.LogWarning(ex, "Error tracking event (attempt {Attempt}/{MaxAttempts})", retryCount + 1, _options.MaxRetryAttempts + 1);
            }

            retryCount++;
            if (retryCount <= _options.MaxRetryAttempts)
            {
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, retryCount)), cancellationToken);
            }
        }

        // If buffering is enabled and all retries failed, buffer the event
        if (_options.EnableBuffering)
        {
            await BufferEventAsync(request);
        }

        if (lastException != null)
        {
            _logger.LogError(lastException, "Failed to track event after {MaxAttempts} attempts", _options.MaxRetryAttempts + 1);
        }

        return null;
    }

    public async Task<List<TrackingEventResponse>> TrackBulkAsync(
        List<(string EventType, Dictionary<string, object>? Metadata)> events,
        CancellationToken cancellationToken = default)
    {
        var bulkRequest = new BulkTrackingEventRequest
        {
            Events = events.Select(e => new TrackingEventRequest
            {
                SubSystemCode = _options.SubSystemCode,
                EventType = e.EventType,
                Metadata = e.Metadata
            }).ToList()
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/v1/tracking/bulk", bulkRequest, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<List<TrackingEventResponse>>>(cancellationToken);
                
                if (apiResponse?.Success == true && apiResponse.Data != null)
                {
                    _logger.LogDebug("Bulk events tracked successfully: {Count} events", events.Count);
                    return apiResponse.Data;
                }
            }

            _logger.LogWarning("Failed to track bulk events: {StatusCode}", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking bulk events");
        }

        return [];
    }

    public void Track(string eventType, Dictionary<string, object>? metadata = null)
    {
        // Fire and forget - don't wait for response
        _ = Task.Run(async () =>
        {
            try
            {
                await TrackAsync(eventType, metadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in fire-and-forget tracking");
            }
        });
    }

    private async Task BufferEventAsync(TrackingEventRequest request)
    {
        await _bufferLock.WaitAsync();
        try
        {
            if (_buffer.Count >= _options.MaxBufferSize)
            {
                _buffer.Dequeue(); // Remove oldest event
            }
            _buffer.Enqueue(request);
            _logger.LogInformation("Event buffered. Buffer size: {BufferSize}", _buffer.Count);
        }
        finally
        {
            _bufferLock.Release();
        }
    }

    /// <summary>
    /// Flush buffered events (call this when connection is restored)
    /// </summary>
    public async Task<int> FlushBufferAsync(CancellationToken cancellationToken = default)
    {
        await _bufferLock.WaitAsync(cancellationToken);
        List<TrackingEventRequest> bufferedEvents;
        
        try
        {
            bufferedEvents = [.. _buffer];
            _buffer.Clear();
        }
        finally
        {
            _bufferLock.Release();
        }

        if (bufferedEvents.Count == 0)
            return 0;

        try
        {
            var bulkRequest = new BulkTrackingEventRequest { Events = bufferedEvents };
            var response = await _httpClient.PostAsJsonAsync("/api/v1/tracking/bulk", bulkRequest, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Flushed {Count} buffered events", bufferedEvents.Count);
                return bufferedEvents.Count;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error flushing buffered events");
            
            // Re-buffer events if flush failed
            await _bufferLock.WaitAsync(cancellationToken);
            try
            {
                foreach (var evt in bufferedEvents)
                {
                    if (_buffer.Count < _options.MaxBufferSize)
                    {
                        _buffer.Enqueue(evt);
                    }
                }
            }
            finally
            {
                _bufferLock.Release();
            }
        }

        return 0;
    }
}
