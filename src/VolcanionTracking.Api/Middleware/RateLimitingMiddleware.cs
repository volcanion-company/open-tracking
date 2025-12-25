using VolcanionTracking.Api.Services;

namespace VolcanionTracking.Api.Middleware;

public class RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger, int requestsPerMinute = 1000)
{
    public async Task InvokeAsync(HttpContext context, ICachingService cachingService)
    {
        // Skip rate limiting for certain paths
        var path = context.Request.Path.Value?.ToLower() ?? "";
        if (path.Contains("/health") || path.Contains("/metrics") || path.Contains("/swagger"))
        {
            await next(context);
            return;
        }

        // Get partner ID from context (set by ApiKeyAuthenticationMiddleware)
        if (!context.Items.TryGetValue("PartnerId", out var partnerIdObj) || partnerIdObj is not Guid partnerId)
        {
            // If no partner ID, skip rate limiting (unauthenticated requests)
            await next(context);
            return;
        }

        // Create rate limit key
        var currentMinute = DateTime.UtcNow.ToString("yyyyMMddHHmm");
        var rateLimitKey = $"ratelimit:{partnerId}:{currentMinute}";

        try
        {
            // Increment counter with 2 minute expiration
            var requestCount = await cachingService.IncrementAsync(rateLimitKey, 1, TimeSpan.FromMinutes(2));

            if (requestCount > requestsPerMinute)
            {
                if (logger.IsEnabled(LogLevel.Warning))
                {
                    logger.LogWarning("Rate limit exceeded for partner {PartnerId}. Count: {Count}", partnerId, requestCount);
                }

                context.Response.StatusCode = 429;
                context.Response.Headers.Append("Retry-After", "60");
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Rate limit exceeded",
                    limit = requestsPerMinute,
                    window = "1 minute"
                });
                return;
            }

            // Add rate limit headers
            context.Response.Headers.Append("X-RateLimit-Limit", requestsPerMinute.ToString());
            context.Response.Headers.Append("X-RateLimit-Remaining", Math.Max(0, requestsPerMinute - (int)requestCount).ToString());
            context.Response.Headers.Append("X-RateLimit-Reset", DateTime.UtcNow.AddMinutes(1).ToString("O"));

            await next(context);
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
            {
                logger.LogError(ex, "Error in rate limiting for partner {PartnerId}", partnerId);
            }
            // Continue processing even if rate limiting fails
            await next(context);
        }
    }
}

public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder, int requestsPerMinute = 1000)
    {
        return builder.UseMiddleware<RateLimitingMiddleware>(requestsPerMinute);
    }
}
