namespace ArchLucid.Core.Identity;

/// <summary>Row shape for <c>dbo.TenantIdentityProviderConfigurations</c>.</summary>
public sealed class TenantIdentityProviderConfigurationRecord
{
    public Guid TenantId { get; init; }

    public TenantIdentityProtocol Protocol { get; init; }

    public string IssuerUri { get; init; } = string.Empty;

    public string? MetadataXml { get; init; }

    public string ClaimMappingJson { get; init; } = string.Empty;

    public string? KeyVaultSecretName { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }

    public string UpdatedByActorId { get; init; } = string.Empty;

    public bool IsActive { get; init; }
}
