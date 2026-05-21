namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Request body for <c>POST /v1/admin/identity/activate</c>.</summary>
public sealed class IdentityProviderActivateRequest
{
    public string Protocol { get; init; } = string.Empty;

    public string IssuerUri { get; init; } = string.Empty;

    public string? MetadataXml { get; init; }

    public IdentityClaimRoleMappingRequest ClaimMapping { get; init; } = new();

    public string? KeyVaultSecretName { get; init; }
}
