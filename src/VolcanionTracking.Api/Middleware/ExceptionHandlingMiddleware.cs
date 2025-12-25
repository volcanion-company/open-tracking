using System.Diagnostics;
using System.Text.Json;

namespace VolcanionTracking.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (InvalidOperationException ex)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(ex, "Invalid operation: {Message}", ex.Message);
            }
            await HandleExceptionAsync(context, ex, 400, "Invalid operation");
        }
        catch (UnauthorizedAccessException ex)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(ex, "Unauthorized access: {Message}", ex.Message);
            }
            await HandleExceptionAsync(context, ex, 403, "Forbidden");
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
            {
                logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            }
            await HandleExceptionAsync(context, ex, 500, "Internal server error");
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, int statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new
        {
            success = false,
            message,
            error = exception.Message,
            timestamp = DateTime.UtcNow,
            traceId = Activity.Current?.Id ?? context.TraceIdentifier
        };

        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
