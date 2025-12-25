using System.Security.Cryptography;
using System.Text;
using VolcanionTracking.Api.Data.Repositories;
using VolcanionTracking.Api.Models.Entities;
using VolcanionTracking.Api.Services;

namespace VolcanionTracking.Api.Middleware;

public class ApiKeyAuthenticationMiddleware(RequestDelegate next, ILogger<ApiKeyAuthenticationMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, IPartnerApiKeyRepository apiKeyRepository, IApiKeyService apiKeyService, ICachingService cachingService)
    {
        // Skip authentication for certain paths
        var path = context.Request.Path.Value?.ToLower() ?? "";
        if (path.Contains("/health") || 
            path.Contains("/metrics") || 
            path.Contains("/swagger") ||
            path.Contains("/scalar") ||
            path.Contains("/openapi"))
        {
            await next(context);
            return;
        }

        // Skip for management/read endpoints (admin dashboard access)
        // These endpoints should use different auth mechanism in production
        if (path.StartsWith("/api/v1/partners") || 
            path.StartsWith("/api/v1/sub-systems") ||
            path.StartsWith("/api/v1/reports"))
        {
            await next(context);
            return;
        }

        // Extract API key from header
        if (!context.Request.Headers.TryGetValue("X-Api-Key", out var apiKeyValue) || string.IsNullOrEmpty(apiKeyValue))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { error = "API Key is required" });
            return;
        }

        var apiKey = apiKeyValue.ToString();

        try
        {
            // Use SHA256 hash of raw API key as cache key (not the PBKDF2 hash)
            var cacheKeyHash = ComputeSHA256(apiKey);
            var cacheKey = $"apikey:{cacheKeyHash}";
            var cachedPartnerId = await cachingService.GetAsync<Guid?>(cacheKey);

            Guid partnerId;

            if (cachedPartnerId.HasValue)
            {
                partnerId = cachedPartnerId.Value;
            }
            else
            {
                // Get all active API keys and validate against each one
                var activeApiKeys = await apiKeyRepository.GetAllActiveAsync();
                PartnerApiKey? validApiKey = null;

                foreach (var apiKeyEntity in activeApiKeys)
                {
                    if (apiKeyService.ValidateApiKey(apiKey, apiKeyEntity.ApiKeyHash))
                    {
                        validApiKey = apiKeyEntity;
                        break;
                    }
                }

                if (validApiKey == null)
                {
                    if (logger.IsEnabled(LogLevel.Warning))
                    {
                        logger.LogWarning("Invalid API key attempted");
                    }
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { error = "Invalid API Key" });
                    return;
                }

                partnerId = validApiKey.PartnerId;

                // Cache the partner ID for 10 minutes
                await cachingService.SetAsync(cacheKey, partnerId, TimeSpan.FromMinutes(10));
            }

            // Store partner ID in HttpContext for downstream use
            context.Items["PartnerId"] = partnerId;

            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating API key");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { error = "Internal server error" });
        }
    }

    private static string ComputeSHA256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(bytes);
    }
}

public static class ApiKeyAuthenticationMiddlewareExtensions
{
    public static IApplicationBuilder UseApiKeyAuthentication(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ApiKeyAuthenticationMiddleware>();
    }
}
