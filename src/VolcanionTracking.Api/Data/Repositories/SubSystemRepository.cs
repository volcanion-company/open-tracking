using Microsoft.EntityFrameworkCore;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public class SubSystemRepository(VolcanionTrackingDbContext dbContext, ILogger<SubSystemRepository> logger) : ISubSystemRepository
{
    public async Task<SubSystem?> GetByIdAsync(Guid id)
    {
        return await dbContext.SubSystems
            .Include(s => s.Partner)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<SubSystem?> GetByCodeAsync(Guid partnerId, string code)
    {
        return await dbContext.SubSystems
            .AsNoTracking()
            .Include(s => s.Partner)
            .FirstOrDefaultAsync(s => s.PartnerId == partnerId && s.Code == code && s.Status == "Active");
    }

    public async Task<List<SubSystem>> GetByPartnerIdAsync(Guid partnerId)
    {
        return await dbContext.SubSystems
            .AsNoTracking()
            .Where(s => s.PartnerId == partnerId && s.Status != "Deleted")
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<SubSystem>> GetAllAsync()
    {
        return await dbContext.SubSystems
            .AsNoTracking()
            .Where(s => s.Status != "Deleted")
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(SubSystem subSystem)
    {
        await dbContext.SubSystems.AddAsync(subSystem);
        await dbContext.SaveChangesAsync();
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("SubSystem {SubSystemId} added for Partner {PartnerId}", subSystem.Id, subSystem.PartnerId);
        }
    }

    public async Task UpdateAsync(SubSystem subSystem)
    {
        dbContext.SubSystems.Update(subSystem);
        await dbContext.SaveChangesAsync();
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("SubSystem {SubSystemId} updated successfully", subSystem.Id);
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        var subSystem = await dbContext.SubSystems.FindAsync(id);
        if (subSystem != null)
        {
            subSystem.Status = "Deleted";
            await dbContext.SaveChangesAsync();
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("SubSystem {SubSystemId} deleted successfully", id);
            }
        }
    }
}
