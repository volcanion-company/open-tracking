using Microsoft.AspNetCore.Mvc;
using VolcanionTracking.Api.Models.DTOs;
using VolcanionTracking.Api.Services;

namespace VolcanionTracking.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(IReportService reportService, ILogger<ReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    [HttpGet("sub-systems/{subSystemId}")]
    public async Task<ActionResult<ApiResponse<SubSystemReportResponse>>> GetSubSystemReport(
        Guid subSystemId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string? eventType = null)
    {
        var request = new ReportRequest
        {
            StartDate = startDate,
            EndDate = endDate,
            EventType = eventType
        };

        var report = await _reportService.GetSubSystemReportAsync(subSystemId, request);
        return Ok(ApiResponse<SubSystemReportResponse>.SuccessResponse(report));
    }

    [HttpGet("partners/{partnerId}")]
    public async Task<ActionResult<ApiResponse<PartnerReportResponse>>> GetPartnerReport(
        Guid partnerId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var request = new ReportRequest
        {
            StartDate = startDate,
            EndDate = endDate
        };

        var report = await _reportService.GetPartnerReportAsync(partnerId, request);
        return Ok(ApiResponse<PartnerReportResponse>.SuccessResponse(report));
    }
}
