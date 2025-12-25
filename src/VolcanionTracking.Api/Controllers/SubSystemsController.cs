using Microsoft.AspNetCore.Mvc;
using VolcanionTracking.Api.Models.DTOs;
using VolcanionTracking.Api.Services;

namespace VolcanionTracking.Api.Controllers;

[ApiController]
[Route("api/v1/sub-systems")]
public class SubSystemsController : ControllerBase
{
    private readonly IPartnerService _partnerService;
    private readonly ILogger<SubSystemsController> _logger;

    public SubSystemsController(IPartnerService partnerService, ILogger<SubSystemsController> logger)
    {
        _partnerService = partnerService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SubSystemResponse>>>> GetAllSubSystems()
    {
        var subSystems = await _partnerService.GetAllSubSystemsAsync();
        return Ok(ApiResponse<List<SubSystemResponse>>.SuccessResponse(subSystems));
    }
}
