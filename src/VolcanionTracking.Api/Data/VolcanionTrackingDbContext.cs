using Microsoft.EntityFrameworkCore;
using VolcanionTracking.Api.Models.Entities;

namespace VolcanionTracking.Api.Data;

public class VolcanionTrackingDbContext(DbContextOptions<VolcanionTrackingDbContext> options) : DbContext(options)
{
    public DbSet<Partner> Partners { get; set; }
    public DbSet<PartnerApiKey> PartnerApiKeys { get; set; }
    public DbSet<SubSystem> SubSystems { get; set; }
    public DbSet<TrackingEvent> TrackingEvents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Partner configuration
        modelBuilder.Entity<Partner>(entity =>
        {
            entity.HasMany(p => p.ApiKeys)
                .WithOne(a => a.Partner)
                .HasForeignKey(a => a.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.SubSystems)
                .WithOne(s => s.Partner)
                .HasForeignKey(s => s.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.TrackingEvents)
                .WithOne(t => t.Partner)
                .HasForeignKey(t => t.PartnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // SubSystem configuration
        modelBuilder.Entity<SubSystem>(entity =>
        {
            entity.HasMany(s => s.TrackingEvents)
                .WithOne(t => t.SubSystem)
                .HasForeignKey(t => t.SubSystemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TrackingEvent configuration - optimize for time-series queries
        modelBuilder.Entity<TrackingEvent>(entity =>
        {
            // Composite indexes for time-range queries
            entity.HasIndex(e => new { e.PartnerId, e.EventTime })
                .HasDatabaseName("idx_tracking_events_partner_time");

            entity.HasIndex(e => new { e.SubSystemId, e.EventTime })
                .HasDatabaseName("idx_tracking_events_subsystem_time");

            entity.HasIndex(e => e.EventTime)
                .HasDatabaseName("idx_tracking_events_time");

            // JSONB index for metadata queries (PostgreSQL specific)
            entity.HasIndex(e => e.Metadata)
                .HasDatabaseName("idx_tracking_events_metadata")
                .HasMethod("gin"); // GIN index for JSONB
        });
    }
}
