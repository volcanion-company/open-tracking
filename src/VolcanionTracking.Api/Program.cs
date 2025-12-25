using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using StackExchange.Redis;
using VolcanionTracking.Api.BackgroundServices;
using VolcanionTracking.Api.Data;
using VolcanionTracking.Api.Data.Repositories;
using VolcanionTracking.Api.Middleware;
using VolcanionTracking.Api.Models.Entities;
using VolcanionTracking.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Configure PostgreSQL with Entity Framework Core
builder.Services.AddDbContext<VolcanionTrackingDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("PostgreSQL") 
        ?? "Host=localhost;Port=5432;Database=volcanion_tracking;Username=postgres;Password=postgres";
    
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
        npgsqlOptions.CommandTimeout(30);
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
        options.ConfigureWarnings(warnings => 
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
});

// Configure Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var connectionString = config.GetValue<string>("Redis:ConnectionString") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

// Configure Channel for background processing
builder.Services.AddSingleton(sp =>
{
    var capacity = builder.Configuration.GetValue<int>("BackgroundWorker:ChannelCapacity", 10000);
    return Channel.CreateBounded<TrackingEvent>(new BoundedChannelOptions(capacity)
    {
        FullMode = BoundedChannelFullMode.Wait
    });
});

// Register Repositories
builder.Services.AddScoped<IPartnerRepository, PartnerRepository>();
builder.Services.AddScoped<IPartnerApiKeyRepository, PartnerApiKeyRepository>();
builder.Services.AddScoped<ISubSystemRepository, SubSystemRepository>();
builder.Services.AddScoped<ITrackingEventRepository, TrackingEventRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Register Services
builder.Services.AddSingleton<ICachingService, RedisCachingService>();
builder.Services.AddSingleton<IApiKeyService, ApiKeyService>();
builder.Services.AddScoped<IPartnerService, PartnerService>();
builder.Services.AddScoped<ITrackingService, TrackingService>();
builder.Services.AddScoped<IReportService, ReportService>();

// Register Background Services
builder.Services.AddHostedService<TrackingEventProcessor>();

// Configure OpenTelemetry
var serviceName = builder.Configuration.GetValue<string>("OpenTelemetry:ServiceName") ?? "VolcanionTrackingApi";
var serviceVersion = builder.Configuration.GetValue<string>("OpenTelemetry:ServiceVersion") ?? "1.0.0";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(
        serviceName: serviceName,
        serviceVersion: serviceVersion))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddPrometheusExporter());

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Initialize PostgreSQL database with migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<VolcanionTrackingDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Applying database migrations...");
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error applying database migrations");
        throw;
    }
}

// Configure the HTTP request pipeline
app.UseExceptionHandling();

// Map OpenAPI endpoint
app.MapOpenApi();

// Use Scalar UI for API documentation
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("Volcanion Tracking API")
        .WithTheme(ScalarTheme.Purple)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
        .WithPreferredScheme("ApiKey")
        .WithApiKeyAuthentication(x => x.Token = "your-api-key-here");
});

app.UseSerilogRequestLogging();

app.UseRouting();

app.UseCors();

// Custom middleware
var rateLimitConfig = builder.Configuration.GetValue<int>("RateLimiting:RequestsPerMinute", 1000);
app.UseRateLimiting(rateLimitConfig);
app.UseApiKeyAuthentication();

app.UseAuthorization();

// Map Prometheus metrics endpoint
app.MapPrometheusScrapingEndpoint();

app.MapControllers();

app.Run();
