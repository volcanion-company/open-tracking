using System.Threading.Channels;
using VolcanionTracking.Api.Data.Repositories;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.BackgroundServices;

public class TrackingEventProcessor : BackgroundService
{
    private readonly Channel<TrackingEvent> _eventChannel;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TrackingEventProcessor> _logger;
    private const int BatchSize = 100;
    private const int BatchTimeoutMs = 1000;

    public TrackingEventProcessor(
        Channel<TrackingEvent> eventChannel,
        IServiceProvider serviceProvider,
        ILogger<TrackingEventProcessor> logger)
    {
        _eventChannel = eventChannel;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TrackingEventProcessor started");

        var batch = new List<TrackingEvent>();
        var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(BatchTimeoutMs));

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var hasEvents = true;
                
                // Try to read events until batch is full or timeout
                while (batch.Count < BatchSize && hasEvents && !stoppingToken.IsCancellationRequested)
                {
                    using var cts = new CancellationTokenSource(BatchTimeoutMs);
                    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cts.Token, stoppingToken);

                    try
                    {
                        var evt = await _eventChannel.Reader.ReadAsync(linkedCts.Token);
                        batch.Add(evt);
                    }
                    catch (OperationCanceledException)
                    {
                        hasEvents = false;
                    }
                }

                // Process batch if we have events
                if (batch.Count > 0)
                {
                    await ProcessBatchAsync(batch);
                    batch.Clear();
                }

                // Wait for next interval if no events
                if (!hasEvents)
                {
                    await timer.WaitForNextTickAsync(stoppingToken);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in TrackingEventProcessor");
        }

        _logger.LogInformation("TrackingEventProcessor stopped");
    }

    private async Task ProcessBatchAsync(List<TrackingEvent> events)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<ITrackingEventRepository>();

            await repository.BulkAddAsync(events);

            _logger.LogInformation("Processed batch of {Count} tracking events", events.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing batch of {Count} events", events.Count);
            // TODO: Implement retry logic or dead letter queue
        }
    }
}
