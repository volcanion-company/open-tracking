using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VolcanionTracking.Api.Models.Enums;

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
    
    [Column("user_id")]
    public string? UserId { get; set; }
    
    [Column("trace_id")]
    public string? TraceId { get; set; }

    [Column("session_id")]
    public string? SessionId { get; set; }

    [Column("client_type")]
    public ClientType ClientType { get; set; }

    [Required]
    [Column("event_time")]
    public DateTime EventTime { get; set; }
    
    [Required]
    [Column("event_type")]
    public EventType EventType { get; set; }
    
    [Column("metadata", TypeName = "jsonb")]
    public string Metadata { get; set; } = "{}";
    
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
