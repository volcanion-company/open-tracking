using Microsoft.EntityFrameworkCore.Storage;

namespace VolcanionTracking.Api.Data;

public class UnitOfWork(VolcanionTrackingDbContext dbContext, ILogger<UnitOfWork> logger) : IUnitOfWork
{
    private IDbContextTransaction? _transaction;

    public async Task<int> SaveChangesAsync()
    {
        return await dbContext.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await dbContext.Database.BeginTransactionAsync();
        logger.LogDebug("Transaction started");
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
            logger.LogDebug("Transaction committed");
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
            logger.LogWarning("Transaction rolled back");
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        GC.SuppressFinalize(this);
    }
}
