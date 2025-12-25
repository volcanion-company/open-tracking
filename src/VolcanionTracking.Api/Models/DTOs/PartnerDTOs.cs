namespace VolcanionTracking.Api.Models.DTOs;

public class CreatePartnerRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class UpdatePartnerRequest
{
    public string? Name { get; set; }
    public string? Status { get; set; }
}

public class PartnerResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class GenerateApiKeyResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty; // Plain text, shown once
    public DateTime? ExpiredAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateApiKeyRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime? ExpiredAt { get; set; }
}

public class ApiKeyResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ExpiredAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSubSystemRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class SubSystemResponse
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
