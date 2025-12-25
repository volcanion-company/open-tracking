using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VolcanionTracking.Api.Models.Entities;

[Table("partners")]
[Index(nameof(Code), IsUnique = true)]
public class Partner
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
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
    
    // Navigation properties
    public ICollection<PartnerApiKey> ApiKeys { get; set; } = [];
    public ICollection<SubSystem> SubSystems { get; set; } = [];
    public ICollection<TrackingEvent> TrackingEvents { get; set; } = [];
}
