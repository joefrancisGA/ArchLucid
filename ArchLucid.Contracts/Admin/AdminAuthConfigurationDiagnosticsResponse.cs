namespace ArchLucid.Contracts.Admin;

/// <summary>
///     Operator-facing auth configuration checks for OIDC, SAML, and tenant SSO wizard state. No secrets.
/// </summary>
public sealed class AdminAuthConfigurationDiagnosticsResponse
{
    /// <summary>Configured <c>ArchLucidAuth:Mode</c> value (DevelopmentBypass, JwtBearer, or ApiKey).</summary>
    public string AuthMode { get; init; } = string.Empty;

    /// <summary>True when <c>ArchLucidAuth:Audience</c> or local JWT audience is configured.</summary>
    public bool AudienceConfigured { get; init; }

    /// <summary>
    ///     True when OIDC authority, local JWT issuer, or SAML SP entity id is configured for the active auth surfaces.
    /// </summary>
    public bool IssuerOrAuthorityConfigured { get; init; }

    /// <summary>Null when discovery was not attempted; otherwise mirrors OIDC discovery success.</summary>
    public bool? OpenIdDiscoverySucceeded { get; init; }

    /// <summary>Effective <c>ArchLucidAuth:Saml2:Enabled</c>.</summary>
    public bool Saml2Enabled { get; init; }

    /// <summary>Null when SAML is disabled; true when SP entity id (<c>Issuer</c>) is a non-empty absolute URI.</summary>
    public bool? SpEntityIdConfigured { get; init; }

    /// <summary>
    ///     Null when SAML is disabled; true when at least one <c>RoleClaimSources</c> entry is configured for inbound SAML roles.
    /// </summary>
    public bool? SamlRoleClaimSourcesConfigured { get; init; }

    /// <summary>
    ///     Null when no tenant SSO row exists; true when persisted <c>ClaimMappingJson</c> has a non-empty
    ///     <c>RoleClaimName</c> and at least one mapping entry.
    /// </summary>
    public bool? TenantClaimMappingConfigured { get; init; }

    /// <summary>Protocol from <c>TenantIdentityProviderConfigurations</c> when a row exists for the current tenant.</summary>
    public string? TenantIdentityProviderProtocol { get; init; }

    /// <summary>
    ///     Null when OIDC discovery was not attempted or local JWT signing is used; true when JWKS URI is present in
    ///     discovery or local PEM validation is configured.
    /// </summary>
    public bool? JwksConfigured { get; init; }

    /// <summary>Null when tenant scope is unavailable; true when at least one SCIM token row exists for the tenant.</summary>
    public bool? ScimProvisioningConfigured { get; init; }

    /// <summary>Null when tenant scope is unavailable; true when at least one active SCIM bearer token exists.</summary>
    public bool? ScimBearerTokenActive { get; init; }

    /// <summary>
    ///     Null when no role-mapping surface is configured; true when host SAML role sources or tenant claim mapping
    ///     includes a non-empty role claim name.
    /// </summary>
    public bool? RoleClaimNameConfigured { get; init; }

    /// <summary>Bounded operator hints — safe for logs and tickets (no secrets).</summary>
    public IReadOnlyList<string> MisconfigurationHints { get; init; } = [];
}
