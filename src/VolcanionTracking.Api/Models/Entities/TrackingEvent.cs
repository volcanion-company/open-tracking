using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VolcanionTracking.Api.Models.Entities;

[Table("tracking_events")]
[Index(nameof(PartnerId), nameof(EventTime))]
[Index(nameof(SubSystemId), nameof(EventTime))]
[Index(nameof(EventTime))]
public class TrackingEvent
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Required]
    [Column("partner_id")]
    public Guid PartnerId { get; set; }
    
    [Required]
    [Column("sub_system_id")]
    public Guid SubSystemId { get; set; }
    
    [Required]
    [Column("event_time")]
    public DateTime EventTime { get; set; }
    
    [Required]
    [MaxLength(100)]
    [Column("event_type")]
    public string EventType { get; set; } = string.Empty;
    
    [Column("metadata", TypeName = "jsonb")]
    public string Metadata { get; set; } = "{}"; // JSON stored as JSONB in PostgreSQL
    
    [MaxLength(50)]
    [Column("ip")]
    public string Ip { get; set; } = string.Empty;
    
    [MaxLength(500)]
    [Column("user_agent")]
    public string UserAgent { get; set; } = string.Empty;
    
    // Navigation
    [ForeignKey(nameof(PartnerId))]
    public Partner? Partner { get; set; }
    
    [ForeignKey(nameof(SubSystemId))]
    public SubSystem? SubSystem { get; set; }
}
