namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Request body for <c>POST /v1/admin/identity/test-login</c>.</summary>
public sealed class IdentityProviderTestLoginRequest
{
    public string Protocol { get; init; } = string.Empty;

    public string IssuerUri { get; init; } = string.Empty;

    public IdentityClaimRoleMappingRequest ClaimMapping { get; init; } = new();

    /// <summary>Sample IdP claim values for the configured role claim (e.g. group ids).</summary>
    public IReadOnlyList<string> SampleClaimValues { get; init; } = [];
}
