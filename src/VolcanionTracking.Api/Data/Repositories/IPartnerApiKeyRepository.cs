using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public interface IPartnerApiKeyRepository
{
    Task<PartnerApiKey?> GetByIdAsync(Guid id);
    Task<PartnerApiKey?> GetByApiKeyHashAsync(string apiKeyHash);
    Task<List<PartnerApiKey>> GetByPartnerIdAsync(Guid partnerId);
    Task<List<PartnerApiKey>> GetAllActiveAsync();
    Task AddAsync(PartnerApiKey apiKey);
    Task UpdateAsync(PartnerApiKey apiKey);
    Task RevokeAsync(Guid id);
}
