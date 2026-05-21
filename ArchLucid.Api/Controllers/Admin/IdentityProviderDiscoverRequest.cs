namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Request body for <c>POST /v1/admin/identity/discover</c>.</summary>
public sealed class IdentityProviderDiscoverRequest
{
    /// <summary><c>oidc</c> or <c>saml</c>.</summary>
    public string Protocol { get; init; } = string.Empty;

    /// <summary>OIDC authority / discovery base URL or SAML metadata URL.</summary>
    public string MetadataUrl { get; init; } = string.Empty;
}
