using Microsoft.EntityFrameworkCore;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public class PartnerApiKeyRepository(VolcanionTrackingDbContext dbContext, ILogger<PartnerApiKeyRepository> logger) : IPartnerApiKeyRepository
{
    public async Task<PartnerApiKey?> GetByIdAsync(Guid id)
    {
        return await dbContext.PartnerApiKeys
            .Include(a => a.Partner)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<PartnerApiKey?> GetByApiKeyHashAsync(string apiKeyHash)
    {
        return await dbContext.PartnerApiKeys
            .Include(a => a.Partner)
            .FirstOrDefaultAsync(a => a.ApiKeyHash == apiKeyHash);
    }

    public async Task<List<PartnerApiKey>> GetByPartnerIdAsync(Guid partnerId)
    {
        return await dbContext.PartnerApiKeys
            .Where(a => a.PartnerId == partnerId)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<PartnerApiKey>> GetAllActiveAsync()
    {
        return await dbContext.PartnerApiKeys
            .Where(a => a.Status == "Active" && (!a.ExpiredAt.HasValue || a.ExpiredAt.Value > DateTime.UtcNow))
            .Include(a => a.Partner)
            .ToListAsync();
    }

    public async Task AddAsync(PartnerApiKey apiKey)
    {
        await dbContext.PartnerApiKeys.AddAsync(apiKey);
        await dbContext.SaveChangesAsync();
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("API Key {ApiKeyId} added for Partner {PartnerId}", apiKey.Id, apiKey.PartnerId);
        }
    }

    public async Task UpdateAsync(PartnerApiKey apiKey)
    {
        dbContext.PartnerApiKeys.Update(apiKey);
        await dbContext.SaveChangesAsync();
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("API Key {ApiKeyId} updated successfully", apiKey.Id);
        }
    }

    public async Task RevokeAsync(Guid id)
    {
        var apiKey = await dbContext.PartnerApiKeys.FindAsync(id);
        if (apiKey != null)
        {
            apiKey.Status = "Revoked";
            await dbContext.SaveChangesAsync();
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("API Key {ApiKeyId} revoked successfully", id);
            }
        }
    }
}
