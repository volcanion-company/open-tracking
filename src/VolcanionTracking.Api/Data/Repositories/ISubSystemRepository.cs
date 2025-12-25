using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public interface ISubSystemRepository
{
    Task<SubSystem?> GetByIdAsync(Guid id);
    Task<SubSystem?> GetByCodeAsync(Guid partnerId, string code);
    Task<List<SubSystem>> GetByPartnerIdAsync(Guid partnerId);
    Task<List<SubSystem>> GetAllAsync();
    Task AddAsync(SubSystem subSystem);
    Task UpdateAsync(SubSystem subSystem);
    Task DeleteAsync(Guid id);
}
