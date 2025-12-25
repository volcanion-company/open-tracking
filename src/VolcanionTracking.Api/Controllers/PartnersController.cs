using Microsoft.AspNetCore.Mvc;
using VolcanionTracking.Api.Models.DTOs;
using VolcanionTracking.Api.Services;

namespace VolcanionTracking.Api.Controllers;

[ApiController]
[Route("api/v1/partners")]
public class PartnersController : ControllerBase
{
    private readonly IPartnerService _partnerService;
    private readonly ILogger<PartnersController> _logger;

    public PartnersController(IPartnerService partnerService, ILogger<PartnersController> logger)
    {
        _partnerService = partnerService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<PartnerResponse>>>> GetAllPartners(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var partners = await _partnerService.GetAllPartnersAsync(page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<PartnerResponse>>.SuccessResponse(partners));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PartnerResponse>>> GetPartner(Guid id)
    {
        var partner = await _partnerService.GetPartnerAsync(id);
        if (partner == null)
            return NotFound(ApiResponse<PartnerResponse>.ErrorResponse("Partner not found"));

        return Ok(ApiResponse<PartnerResponse>.SuccessResponse(partner));
    }

    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<ApiResponse<PartnerResponse>>> GetPartnerByCode(string code)
    {
        var partner = await _partnerService.GetPartnerByCodeAsync(code);
        if (partner == null)
            return NotFound(ApiResponse<PartnerResponse>.ErrorResponse("Partner not found"));

        return Ok(ApiResponse<PartnerResponse>.SuccessResponse(partner));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PartnerResponse>>> CreatePartner([FromBody] CreatePartnerRequest request)
    {
        var partner = await _partnerService.CreatePartnerAsync(request);
        return CreatedAtAction(nameof(GetPartner), new { id = partner.Id }, ApiResponse<PartnerResponse>.SuccessResponse(partner, "Partner created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PartnerResponse>>> UpdatePartner(Guid id, [FromBody] UpdatePartnerRequest request)
    {
        var partner = await _partnerService.UpdatePartnerAsync(id, request);
        return Ok(ApiResponse<PartnerResponse>.SuccessResponse(partner, "Partner updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> DeletePartner(Guid id)
    {
        await _partnerService.DeletePartnerAsync(id);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Partner deleted successfully"));
    }

    [HttpPatch("{id}/toggle-status")]
    public async Task<ActionResult<ApiResponse<PartnerResponse>>> TogglePartnerStatus(Guid id)
    {
        var partner = await _partnerService.TogglePartnerStatusAsync(id);
        return Ok(ApiResponse<PartnerResponse>.SuccessResponse(partner, "Partner status updated successfully"));
    }

    // API Keys Management
    [HttpPost("{id}/api-keys")]
    public async Task<ActionResult<ApiResponse<GenerateApiKeyResponse>>> GenerateApiKey(Guid id, [FromBody] CreateApiKeyRequest request)
    {
        var apiKey = await _partnerService.GenerateApiKeyAsync(id, request.Name, request.ExpiredAt);
        return Ok(ApiResponse<GenerateApiKeyResponse>.SuccessResponse(apiKey, "API Key generated successfully. Please save it securely - it will not be shown again."));
    }

    [HttpPost("{id}/api-keys/{apiKeyId}/regenerate")]
    public async Task<ActionResult<ApiResponse<GenerateApiKeyResponse>>> RegenerateApiKey(Guid id, Guid apiKeyId, [FromBody] CreateApiKeyRequest? request = null)
    {
        var apiKey = await _partnerService.RegenerateApiKeyAsync(id, apiKeyId, request?.Name, request?.ExpiredAt);
        return Ok(ApiResponse<GenerateApiKeyResponse>.SuccessResponse(apiKey, "API Key regenerated successfully. Old key has been revoked. Please save the new key securely - it will not be shown again."));
    }

    [HttpGet("{id}/api-keys")]
    public async Task<ActionResult<ApiResponse<List<ApiKeyResponse>>>> GetApiKeys(Guid id)
    {
        var apiKeys = await _partnerService.GetApiKeysAsync(id);
        return Ok(ApiResponse<List<ApiKeyResponse>>.SuccessResponse(apiKeys));
    }

    [HttpDelete("{id}/api-keys/{apiKeyId}")]
    public async Task<ActionResult<ApiResponse<object?>>> RevokeApiKey(Guid id, Guid apiKeyId)
    {
        await _partnerService.RevokeApiKeyAsync(id, apiKeyId);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "API Key revoked successfully"));
    }

    // SubSystems Management
    [HttpPost("{id}/sub-systems")]
    public async Task<ActionResult<ApiResponse<SubSystemResponse>>> CreateSubSystem(Guid id, [FromBody] CreateSubSystemRequest request)
    {
        var subSystem = await _partnerService.CreateSubSystemAsync(id, request);
        return Ok(ApiResponse<SubSystemResponse>.SuccessResponse(subSystem, "SubSystem created successfully"));
    }

    [HttpGet("{id}/sub-systems")]
    public async Task<ActionResult<ApiResponse<List<SubSystemResponse>>>> GetSubSystems(Guid id)
    {
        var subSystems = await _partnerService.GetSubSystemsAsync(id);
        return Ok(ApiResponse<List<SubSystemResponse>>.SuccessResponse(subSystems));
    }
    [HttpGet("{id}/sub-systems/{subSystemId}")]
    public async Task<ActionResult<ApiResponse<SubSystemResponse>>> GetSubSystem(Guid id, Guid subSystemId)
    {
        var subSystem = await _partnerService.GetSubSystemAsync(subSystemId);
        if (subSystem == null)
            return NotFound(ApiResponse<SubSystemResponse>.ErrorResponse("SubSystem not found"));

        return Ok(ApiResponse<SubSystemResponse>.SuccessResponse(subSystem));
    }
    [HttpPut("{id}/sub-systems/{subSystemId}")]
    public async Task<ActionResult<ApiResponse<SubSystemResponse>>> UpdateSubSystem(Guid id, Guid subSystemId, [FromBody] CreateSubSystemRequest request)
    {
        var subSystem = await _partnerService.UpdateSubSystemAsync(subSystemId, request);
        return Ok(ApiResponse<SubSystemResponse>.SuccessResponse(subSystem, "SubSystem updated successfully"));
    }

    [HttpGet("{id}/sub-systems/by-code/{code}")]
    public async Task<ActionResult<ApiResponse<SubSystemResponse>>> GetSubSystemByCode(Guid id, string code)
    {
        var subSystem = await _partnerService.GetSubSystemByCodeAsync(id, code);
        if (subSystem == null)
            return NotFound(ApiResponse<SubSystemResponse>.ErrorResponse("SubSystem not found"));

        return Ok(ApiResponse<SubSystemResponse>.SuccessResponse(subSystem));
    }

    [HttpDelete("{id}/sub-systems/{subSystemId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSubSystem(Guid id, Guid subSystemId)
    {
        await _partnerService.DeleteSubSystemAsync(subSystemId);
        return Ok(ApiResponse<object>.SuccessResponse(null, "SubSystem deleted successfully"));
    }

    [HttpPatch("{id}/sub-systems/{subSystemId}/toggle-status")]
    public async Task<ActionResult<ApiResponse<SubSystemResponse>>> ToggleSubSystemStatus(Guid id, Guid subSystemId)
    {
        var subSystem = await _partnerService.ToggleSubSystemStatusAsync(subSystemId);
        return Ok(ApiResponse<SubSystemResponse>.SuccessResponse(subSystem, "SubSystem status updated successfully"));
    }
}
