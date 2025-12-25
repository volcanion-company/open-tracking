using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VolcanionTracking.Api.Models.Entities;

[Table("sub_systems")]
[Index(nameof(PartnerId))]
[Index(nameof(Code))]
public class SubSystem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Required]
    [Column("partner_id")]
    public Guid PartnerId { get; set; }
    
    [Required]
    [MaxLength(100)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "Active";
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    // Navigation
    [ForeignKey(nameof(PartnerId))]
    public Partner? Partner { get; set; }
    public ICollection<TrackingEvent> TrackingEvents { get; set; } = [];
}
