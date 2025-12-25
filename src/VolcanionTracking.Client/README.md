# Volcanion Tracking Client SDK

Easy-to-use .NET client library for integrating with Volcanion Tracking API.

## Installation

```bash
dotnet add package VolcanionTracking.Client
```

## Quick Start

### 1. Configure in `appsettings.json`

```json
{
  "VolcanionTracking": {
    "ApiUrl": "https://localhost:5000",
    "ApiKey": "your-api-key-here",
    "SubSystemCode": "WEB_APP",
    "EnableRetry": true,
    "MaxRetryAttempts": 3,
    "TimeoutSeconds": 30,
    "EnableBuffering": false,
    "MaxBufferSize": 1000
  }
}
```

### 2. Register in `Program.cs`

```csharp
using VolcanionTracking.Client;

var builder = WebApplication.CreateBuilder(args);

// Add Volcanion Tracking
builder.Services.AddVolcanionTracking(builder.Configuration);

var app = builder.Build();
app.Run();
```

### 3. Use in Your Code

```csharp
using VolcanionTracking.Client;

public class HomeController : Controller
{
    private readonly IVolcanionTrackingClient _tracking;

    public HomeController(IVolcanionTrackingClient tracking)
    {
        _tracking = tracking;
    }

    public async Task<IActionResult> Index()
    {
        // Track an event
        await _tracking.TrackAsync("PageView", new Dictionary<string, object>
        {
            ["page"] = "Home",
            ["url"] = "/",
            ["userId"] = User.Identity?.Name ?? "anonymous"
        });

        return View();
    }
}
```

## Usage Examples

### Track Single Event (Async)

```csharp
var response = await _tracking.TrackAsync("ButtonClick", new Dictionary<string, object>
{
    ["button"] = "Subscribe",
    ["location"] = "Header"
});

if (response != null)
{
    Console.WriteLine($"Event tracked: {response.Id}");
}
```

### Track Event (Fire and Forget)

```csharp
// Non-blocking - doesn't wait for response
_tracking.Track("PageView", new Dictionary<string, object>
{
    ["page"] = "About"
});
```

### Track Multiple Events

```csharp
var events = new List<(string EventType, Dictionary<string, object>? Metadata)>
{
    ("PageView", new Dictionary<string, object> { ["page"] = "Home" }),
    ("ButtonClick", new Dictionary<string, object> { ["button"] = "Subscribe" }),
    ("FormSubmit", new Dictionary<string, object> { ["form"] = "Newsletter" })
};

var responses = await _tracking.TrackBulkAsync(events);
Console.WriteLine($"Tracked {responses.Count} events");
```

### With Offline Buffering

Enable buffering in configuration:

```json
{
  "VolcanionTracking": {
    "EnableBuffering": true,
    "MaxBufferSize": 1000
  }
}
```

Flush buffered events when connection is restored:

```csharp
var flushedCount = await _tracking.FlushBufferAsync();
Console.WriteLine($"Flushed {flushedCount} buffered events");
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ApiUrl` | string | `https://localhost:5000` | Base URL of Volcanion Tracking API |
| `ApiKey` | string | (required) | Your partner API key |
| `SubSystemCode` | string | (required) | Your subsystem code |
| `EnableRetry` | bool | `true` | Enable automatic retry on failure |
| `MaxRetryAttempts` | int | `3` | Maximum retry attempts |
| `TimeoutSeconds` | int | `30` | HTTP request timeout |
| `EnableBuffering` | bool | `false` | Buffer events when offline |
| `MaxBufferSize` | int | `1000` | Maximum buffered events |

## Manual Configuration

You can also configure without `appsettings.json`:

```csharp
builder.Services.AddVolcanionTracking(options =>
{
    options.ApiUrl = "https://api.yourdomain.com";
    options.ApiKey = "your-api-key";
    options.SubSystemCode = "WEB_APP";
    options.EnableRetry = true;
    options.MaxRetryAttempts = 3;
});
```

## Best Practices

1. **Use Fire-and-Forget for Non-Critical Tracking**
   ```csharp
   _tracking.Track("PageView", metadata); // Non-blocking
   ```

2. **Use Async for Critical Events**
   ```csharp
   var result = await _tracking.TrackAsync("Purchase", metadata);
   if (result != null) { /* Success */ }
   ```

3. **Batch Events When Possible**
   ```csharp
   await _tracking.TrackBulkAsync(events); // More efficient
   ```

4. **Enable Buffering for Mobile/Offline Apps**
   ```json
   { "EnableBuffering": true }
   ```

## Error Handling

The client handles errors automatically with:
- Automatic retries with exponential backoff
- Detailed logging via `ILogger`
- Optional buffering for offline scenarios

```csharp
try
{
    await _tracking.TrackAsync("Event", metadata);
}
catch (Exception ex)
{
    // Handle error (client already logs it)
}
```

## License

MIT License - Volcanion Company
