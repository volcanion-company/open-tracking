using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data.Repositories;

public interface IPartnerRepository
{
    Task<Partner?> GetByIdAsync(Guid id);
    Task<Partner?> GetByCodeAsync(string code);
    Task<List<Partner>> GetAllAsync(int page = 1, int pageSize = 50);
    Task<long> GetTotalCountAsync();
    Task AddAsync(Partner partner);
    Task UpdateAsync(Partner partner);
    Task DeleteAsync(Guid id);
}
