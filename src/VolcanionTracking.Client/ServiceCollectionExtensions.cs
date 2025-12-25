using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace VolcanionTracking.Client;

/// <summary>
/// Extension methods for registering Volcanion Tracking Client
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add Volcanion Tracking Client to the service collection
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">The configuration section containing VolcanionTracking settings</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddVolcanionTracking(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<VolcanionTrackingOptions>(configuration.GetSection("VolcanionTracking"));
        
        services.AddHttpClient<IVolcanionTrackingClient, VolcanionTrackingClient>();
        
        return services;
    }

    /// <summary>
    /// Add Volcanion Tracking Client to the service collection with manual configuration
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configure">Action to configure options</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddVolcanionTracking(
        this IServiceCollection services,
        Action<VolcanionTrackingOptions> configure)
    {
        services.Configure(configure);
        
        services.AddHttpClient<IVolcanionTrackingClient, VolcanionTrackingClient>();
        
        return services;
    }
}
