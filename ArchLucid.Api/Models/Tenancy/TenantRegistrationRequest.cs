using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Public self-service tenant registration (Free tier).</summary>
public sealed class TenantRegistrationRequest
{
    [Required]
    [MaxLength(200)]
    public string OrganizationName { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(320)]
    public string AdminEmail { get; init; } = string.Empty;

    [MaxLength(200)]
    public string? AdminDisplayName
    {
        get; init;
    }
}
