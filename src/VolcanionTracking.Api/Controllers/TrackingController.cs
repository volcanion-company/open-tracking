using Microsoft.AspNetCore.Mvc;
using VolcanionTracking.Api.Models.DTOs;
using VolcanionTracking.Api.Services;

namespace VolcanionTracking.Api.Controllers;

[ApiController]
[Route("api/v1/tracking")]
public class TrackingController : ControllerBase
{
    private readonly ITrackingService _trackingService;
    private readonly ILogger<TrackingController> _logger;

    public TrackingController(ITrackingService trackingService, ILogger<TrackingController> logger)
    {
        _trackingService = trackingService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TrackingEventResponse>>> TrackEvent([FromBody] TrackingEventRequest request)
    {
        // Get partner ID from middleware context
        if (!HttpContext.Items.TryGetValue("PartnerId", out var partnerIdObj) || partnerIdObj is not Guid partnerId)
        {
            return Unauthorized(ApiResponse<TrackingEventResponse>.ErrorResponse("Unauthorized"));
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString() ?? "unknown";

        var response = await _trackingService.EnqueueEventAsync(partnerId, request, ip, userAgent);
        return Accepted(ApiResponse<TrackingEventResponse>.SuccessResponse(response, "Event queued for processing"));
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<ApiResponse<List<TrackingEventResponse>>>> TrackBulkEvents([FromBody] BulkTrackingEventRequest request)
    {
        // Get partner ID from middleware context
        if (!HttpContext.Items.TryGetValue("PartnerId", out var partnerIdObj) || partnerIdObj is not Guid partnerId)
        {
            return Unauthorized(ApiResponse<List<TrackingEventResponse>>.ErrorResponse("Unauthorized"));
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString() ?? "unknown";

        var responses = await _trackingService.EnqueueBulkEventsAsync(partnerId, request, ip, userAgent);
        return Accepted(ApiResponse<List<TrackingEventResponse>>.SuccessResponse(responses, $"{responses.Count} events queued for processing"));
    }
}
