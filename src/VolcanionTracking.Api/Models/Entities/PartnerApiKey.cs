using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VolcanionTracking.Api.Models.Entities;

[Table("partner_api_keys")]
[Index(nameof(PartnerId))]
[Index(nameof(ApiKeyHash), IsUnique = true)]
public class PartnerApiKey
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Required]
    [Column("partner_id")]
    public Guid PartnerId { get; set; }
    
    [Required]
    [MaxLength(500)]
    [Column("api_key_hash")]
    public string ApiKeyHash { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "Active";
    
    [Column("expired_at")]
    public DateTime? ExpiredAt { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    // Navigation
    [ForeignKey(nameof(PartnerId))]
    public Partner? Partner { get; set; }
}
