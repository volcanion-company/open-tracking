using Microsoft.EntityFrameworkCore;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public class PartnerRepository(VolcanionTrackingDbContext dbContext, ILogger<PartnerRepository> logger) : IPartnerRepository
{
    public async Task<Partner?> GetByIdAsync(Guid id)
    {
        return await dbContext.Partners
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.ApiKeys.Where(k => k.Status == "Active"))
            .Include(p => p.SubSystems.Where(s => s.Status == "Active"))
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Partner?> GetByCodeAsync(string code)
    {
        return await dbContext.Partners
            .AsNoTracking()
            .AsSplitQuery()  // Separate queries for related data
            .Include(p => p.ApiKeys.Where(k => k.Status == "Active" && (k.ExpiredAt == null || k.ExpiredAt > DateTime.UtcNow)))
            .Include(p => p.SubSystems.Where(s => s.Status == "Active"))
            .FirstOrDefaultAsync(p => p.Code == code);
    }

    public async Task<List<Partner>> GetAllAsync(int page = 1, int pageSize = 50)
    {
        return await dbContext.Partners
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.ApiKeys.Where(k => k.Status == "Active"))
            .Include(p => p.SubSystems.Where(s => s.Status == "Active"))
            .OrderBy(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<long> GetTotalCountAsync()
    {
        return await dbContext.Partners.LongCountAsync();
    }

    public async Task AddAsync(Partner partner)
    {
        await dbContext.Partners.AddAsync(partner);
        await dbContext.SaveChangesAsync();
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Partner {PartnerId} added successfully", partner.Id);
        }
    }

    public async Task UpdateAsync(Partner partner)
    {
        dbContext.Partners.Update(partner);
        await dbContext.SaveChangesAsync();
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Partner {PartnerId} updated successfully", partner.Id);
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        var partner = await dbContext.Partners.FindAsync(id);
        if (partner != null)
        {
            partner.Status = "Deleted";
            await dbContext.SaveChangesAsync();
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("Partner {PartnerId} deleted successfully", id);
            }
        }
    }
}
