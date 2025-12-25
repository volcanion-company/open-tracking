using VolcanionTracking.Api.Data.Repositories;
using VolcanionTracking.Api.Models.DTOs;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Services;

public interface IPartnerService
{
    Task<PartnerResponse?> GetPartnerAsync(Guid id);
    Task<PartnerResponse?> GetPartnerByCodeAsync(string code);
    Task<PaginatedResponse<PartnerResponse>> GetAllPartnersAsync(int page, int pageSize);
    Task<PartnerResponse> CreatePartnerAsync(CreatePartnerRequest request);
    Task<PartnerResponse> UpdatePartnerAsync(Guid id, UpdatePartnerRequest request);
    Task DeletePartnerAsync(Guid id);
    Task<PartnerResponse> TogglePartnerStatusAsync(Guid id);
    Task<GenerateApiKeyResponse> GenerateApiKeyAsync(Guid partnerId, string name, DateTime? expiredAt);
    Task<GenerateApiKeyResponse> RegenerateApiKeyAsync(Guid partnerId, Guid apiKeyId, string? name, DateTime? expiredAt);
    Task<List<ApiKeyResponse>> GetApiKeysAsync(Guid partnerId);
    Task RevokeApiKeyAsync(Guid partnerId, Guid apiKeyId);
    Task<SubSystemResponse> CreateSubSystemAsync(Guid partnerId, CreateSubSystemRequest request);
    Task<SubSystemResponse?> GetSubSystemAsync(Guid subSystemId);
    Task<SubSystemResponse?> GetSubSystemByCodeAsync(Guid partnerId, string code);
    Task<List<SubSystemResponse>> GetSubSystemsAsync(Guid partnerId);
    Task<List<SubSystemResponse>> GetAllSubSystemsAsync();
    Task<SubSystemResponse> UpdateSubSystemAsync(Guid id, CreateSubSystemRequest request);
    Task DeleteSubSystemAsync(Guid id);
    Task<SubSystemResponse> ToggleSubSystemStatusAsync(Guid id);
}

public class PartnerService(
    IPartnerRepository partnerRepository,
    IPartnerApiKeyRepository apiKeyRepository,
    ISubSystemRepository subSystemRepository,
    IApiKeyService apiKeyService,
    ICachingService cachingService,
    ILogger<PartnerService> logger) : IPartnerService
{
    public async Task<PartnerResponse?> GetPartnerAsync(Guid id)
    {
        var cacheKey = $"partner:{id}";
        var cached = await cachingService.GetAsync<PartnerResponse>(cacheKey);
        if (cached != null)
            return cached;

        var partner = await partnerRepository.GetByIdAsync(id);
        if (partner == null)
            return null;

        var response = MapToResponse(partner);
        await cachingService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));
        return response;
    }

    public async Task<PartnerResponse?> GetPartnerByCodeAsync(string code)
    {
        var partner = await partnerRepository.GetByCodeAsync(code);
        return partner == null ? null : MapToResponse(partner);
    }

    public async Task<PaginatedResponse<PartnerResponse>> GetAllPartnersAsync(int page, int pageSize)
    {
        var partners = await partnerRepository.GetAllAsync(page, pageSize);
        var totalCount = await partnerRepository.GetTotalCountAsync();

        return new PaginatedResponse<PartnerResponse>
        {
            Data = [.. partners.Select(MapToResponse)],
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PartnerResponse> CreatePartnerAsync(CreatePartnerRequest request)
    {
        var existing = await partnerRepository.GetByCodeAsync(request.Code);
        if (existing != null)
            throw new InvalidOperationException($"Partner with code {request.Code} already exists");

        var partner = new Partner
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            Name = request.Name,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        await partnerRepository.AddAsync(partner);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Created partner {PartnerId} with code {Code}", partner.Id, partner.Code);
        }

        return MapToResponse(partner);
    }

    public async Task<PartnerResponse> UpdatePartnerAsync(Guid id, UpdatePartnerRequest request)
    {
        var partner = await partnerRepository.GetByIdAsync(id) ?? throw new InvalidOperationException($"Partner {id} not found");
        if (request.Name != null)
            partner.Name = request.Name;
        if (request.Status != null)
            partner.Status = request.Status;

        await partnerRepository.UpdateAsync(partner);
        await cachingService.RemoveAsync($"partner:{id}");

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Updated partner {PartnerId}", id);
        }
        return MapToResponse(partner);
    }

    public async Task DeletePartnerAsync(Guid id)
    {
        await partnerRepository.DeleteAsync(id);
        await cachingService.RemoveAsync($"partner:{id}");
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Deleted partner {PartnerId}", id);
        }
    }

    public async Task<PartnerResponse> TogglePartnerStatusAsync(Guid id)
    {
        var partner = await partnerRepository.GetByIdAsync(id) ?? throw new InvalidOperationException("Partner not found");
        partner.Status = partner.Status == "Active" ? "Inactive" : "Active";
        await partnerRepository.UpdateAsync(partner);
        await cachingService.RemoveAsync($"partner:{id}");

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Toggled partner {PartnerId} status to {Status}", id, partner.Status);
        }

        return MapToResponse(partner);
    }

    public async Task<GenerateApiKeyResponse> GenerateApiKeyAsync(Guid partnerId, string name, DateTime? expiredAt)
    {
        _ = await partnerRepository.GetByIdAsync(partnerId) ?? throw new InvalidOperationException($"Partner {partnerId} not found");
        var apiKey = apiKeyService.GenerateApiKey();
        var hash = apiKeyService.HashApiKey(apiKey);

        var apiKeyEntity = new PartnerApiKey
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId,
            ApiKeyHash = hash,
            Name = name,
            Status = "Active",
            ExpiredAt = expiredAt,
            CreatedAt = DateTime.UtcNow
        };

        await apiKeyRepository.AddAsync(apiKeyEntity);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Generated API key {ApiKeyId} for partner {PartnerId}", apiKeyEntity.Id, partnerId);
        }

        return new GenerateApiKeyResponse
        {
            Id = apiKeyEntity.Id,
            Name = apiKeyEntity.Name,
            ApiKey = apiKey,
            ExpiredAt = expiredAt,
            CreatedAt = apiKeyEntity.CreatedAt
        };
    }

    public async Task<GenerateApiKeyResponse> RegenerateApiKeyAsync(Guid partnerId, Guid apiKeyId, string? name, DateTime? expiredAt)
    {
        // Verify the API key belongs to the partner
        var existingApiKey = await apiKeyRepository.GetByIdAsync(apiKeyId);
        if (existingApiKey == null || existingApiKey.PartnerId != partnerId)
        {
            throw new InvalidOperationException($"API key {apiKeyId} not found for partner {partnerId}");
        }

        // Revoke the old API key
        await apiKeyRepository.RevokeAsync(apiKeyId);
        await cachingService.RemoveAsync($"apikey:{existingApiKey.ApiKeyHash}");

        // Generate new API key
        var newApiKey = apiKeyService.GenerateApiKey();
        var hash = apiKeyService.HashApiKey(newApiKey);

        var apiKeyEntity = new PartnerApiKey
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId,
            ApiKeyHash = hash,
            Name = name ?? existingApiKey.Name,
            Status = "Active",
            ExpiredAt = expiredAt ?? existingApiKey.ExpiredAt,
            CreatedAt = DateTime.UtcNow
        };

        await apiKeyRepository.AddAsync(apiKeyEntity);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Regenerated API key {OldApiKeyId} -> {NewApiKeyId} for partner {PartnerId}", apiKeyId, apiKeyEntity.Id, partnerId);
        }

        return new GenerateApiKeyResponse
        {
            Id = apiKeyEntity.Id,
            Name = apiKeyEntity.Name,
            ApiKey = newApiKey,
            ExpiredAt = apiKeyEntity.ExpiredAt,
            CreatedAt = apiKeyEntity.CreatedAt
        };
    }

    public async Task<List<ApiKeyResponse>> GetApiKeysAsync(Guid partnerId)
    {
        var apiKeys = await apiKeyRepository.GetByPartnerIdAsync(partnerId);
        return [.. apiKeys.Select(k => new ApiKeyResponse
        {
            Id = k.Id,
            Name = k.Name,
            Status = k.Status,
            ExpiredAt = k.ExpiredAt,
            CreatedAt = k.CreatedAt
        })];
    }

    public async Task RevokeApiKeyAsync(Guid partnerId, Guid apiKeyId)
    {
        var apiKey = await apiKeyRepository.GetByIdAsync(apiKeyId);
        if (apiKey == null || apiKey.PartnerId != partnerId)
        {
            throw new InvalidOperationException($"API key {apiKeyId} not found for partner {partnerId}");
        }

        await apiKeyRepository.RevokeAsync(apiKeyId);
        await cachingService.RemoveAsync($"apikey:{apiKey.ApiKeyHash}");
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Revoked API key {ApiKeyId} for partner {PartnerId}", apiKeyId, partnerId);
        }
    }

    public async Task<SubSystemResponse> CreateSubSystemAsync(Guid partnerId, CreateSubSystemRequest request)
    {
        _ = await partnerRepository.GetByIdAsync(partnerId) ?? throw new InvalidOperationException($"Partner {partnerId} not found");
        var existing = await subSystemRepository.GetByCodeAsync(partnerId, request.Code);
        if (existing != null)
            throw new InvalidOperationException($"SubSystem with code {request.Code} already exists for this partner");

        var subSystem = new SubSystem
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId,
            Code = request.Code,
            Name = request.Name,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        await subSystemRepository.AddAsync(subSystem);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Created subsystem {SubSystemId} for partner {PartnerId}", subSystem.Id, partnerId);
        }

        return new SubSystemResponse
        {
            Id = subSystem.Id,
            PartnerId = subSystem.PartnerId,
            Code = subSystem.Code,
            Name = subSystem.Name,
            Status = subSystem.Status,
            CreatedAt = subSystem.CreatedAt
        };
    }

    public async Task<List<SubSystemResponse>> GetSubSystemsAsync(Guid partnerId)
    {
        var subSystems = await subSystemRepository.GetByPartnerIdAsync(partnerId);
        return [.. subSystems.Select(s => new SubSystemResponse
        {
            Id = s.Id,
            PartnerId = s.PartnerId,
            Code = s.Code,
            Name = s.Name,
            Status = s.Status,
            CreatedAt = s.CreatedAt
        })];
    }

    public async Task<List<SubSystemResponse>> GetAllSubSystemsAsync()
    {
        var subSystems = await subSystemRepository.GetAllAsync();
        return [.. subSystems.Select(s => new SubSystemResponse
        {
            Id = s.Id,
            PartnerId = s.PartnerId,
            Code = s.Code,
            Name = s.Name,
            Status = s.Status,
            CreatedAt = s.CreatedAt
        })];
    }

    public async Task<SubSystemResponse?> GetSubSystemAsync(Guid subSystemId)
    {
        var subSystem = await subSystemRepository.GetByIdAsync(subSystemId);
        if (subSystem == null)
            return null;

        return new SubSystemResponse
        {
            Id = subSystem.Id,
            PartnerId = subSystem.PartnerId,
            Code = subSystem.Code,
            Name = subSystem.Name,
            Status = subSystem.Status,
            CreatedAt = subSystem.CreatedAt
        };
    }

    public async Task<SubSystemResponse?> GetSubSystemByCodeAsync(Guid partnerId, string code)
    {
        var subSystem = await subSystemRepository.GetByCodeAsync(partnerId, code);
        if (subSystem == null)
            return null;

        return new SubSystemResponse
        {
            Id = subSystem.Id,
            PartnerId = subSystem.PartnerId,
            Code = subSystem.Code,
            Name = subSystem.Name,
            Status = subSystem.Status,
            CreatedAt = subSystem.CreatedAt
        };
    }

    public async Task<SubSystemResponse> UpdateSubSystemAsync(Guid id, CreateSubSystemRequest request)
    {
        var subSystem = await subSystemRepository.GetByIdAsync(id) ?? throw new InvalidOperationException($"SubSystem {id} not found");
        subSystem.Name = request.Name;
        await subSystemRepository.UpdateAsync(subSystem);
        await cachingService.RemoveAsync($"subsystem:{id}");

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Updated subsystem {SubSystemId}", id);
        }

        return new SubSystemResponse
        {
            Id = subSystem.Id,
            PartnerId = subSystem.PartnerId,
            Code = subSystem.Code,
            Name = subSystem.Name,
            Status = subSystem.Status,
            CreatedAt = subSystem.CreatedAt
        };
    }

    public async Task DeleteSubSystemAsync(Guid id)
    {
        await subSystemRepository.DeleteAsync(id);
        await cachingService.RemoveAsync($"subsystem:{id}");
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Deleted subsystem {SubSystemId}", id);
        }
    }

    public async Task<SubSystemResponse> ToggleSubSystemStatusAsync(Guid id)
    {
        var subSystem = await subSystemRepository.GetByIdAsync(id) ?? throw new InvalidOperationException("SubSystem not found");
        subSystem.Status = subSystem.Status == "Active" ? "Inactive" : "Active";
        await subSystemRepository.UpdateAsync(subSystem);
        await cachingService.RemoveAsync($"subsystem:{id}");

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Toggled subsystem {SubSystemId} status to {Status}", id, subSystem.Status);
        }

        return new SubSystemResponse
        {
            Id = subSystem.Id,
            PartnerId = subSystem.PartnerId,
            Code = subSystem.Code,
            Name = subSystem.Name,
            Status = subSystem.Status,
            CreatedAt = subSystem.CreatedAt
        };
    }

    private PartnerResponse MapToResponse(Partner partner)
    {
        return new PartnerResponse
        {
            Id = partner.Id,
            Code = partner.Code,
            Name = partner.Name,
            Status = partner.Status,
            CreatedAt = partner.CreatedAt
        };
    }
}
