using StackExchange.Redis;
using System.Text.Json;

namespace VolcanionTracking.Api.Services;

public interface ICachingService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task<bool> ExistsAsync(string key);
    Task<long> IncrementAsync(string key, long value = 1, TimeSpan? expiration = null);
}

public class RedisCachingService(IConnectionMultiplexer redis, ILogger<RedisCachingService> logger) : ICachingService
{
    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var db = redis.GetDatabase();
            var value = await db.StringGetAsync(key);

            if (value.IsNullOrEmpty)
                return default;

            return JsonSerializer.Deserialize<T>((string)value!);
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError(ex, "Error getting cache key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var db = redis.GetDatabase();
            var serialized = JsonSerializer.Serialize(value);
            await db.StringSetAsync(key, serialized, expiration ?? TimeSpan.FromMinutes(5));
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
            {
                logger.LogError(ex, "Error setting cache key {Key}", key);
            }
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            var db = redis.GetDatabase();
            await db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
            {
                logger.LogError(ex, "Error removing cache key {Key}", key);
            }
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            var db = redis.GetDatabase();
            return await db.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
            {
                logger.LogError(ex, "Error checking cache key {Key}", key);
            }
            return false;
        }
    }

    public async Task<long> IncrementAsync(string key, long value = 1, TimeSpan? expiration = null)
    {
        try
        {
            var db = redis.GetDatabase();
            var result = await db.StringIncrementAsync(key, value);

            if (expiration.HasValue && result == value)
            {
                await db.KeyExpireAsync(key, expiration.Value);
            }

            return result;
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
            {
                logger.LogError(ex, "Error incrementing cache key {Key}", key);
            }
            return 0;
        }
    }
}
