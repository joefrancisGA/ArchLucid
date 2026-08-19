namespace ArchLucid.Api.Auth.Models;

/// <summary>
///     Optional SAML 2.0 SP settings under <c>ArchLucidAuth:Saml2</c>. <c>Issuer</c> and other SP fields bind to
///     <c>Saml2Configuration</c> when present in the same JSON section.
/// </summary>
/// <remarks>
///     Inbound claim mapping keys are SAML attribute <strong>claim types</strong> as emitted on the
///     <see cref="System.Security.Claims.ClaimsIdentity" /> (often a URI or short name), not display names.
/// </remarks>
public sealed class ArchLucidSamlAuthOptions
{
    /// <summary>Configuration path for enablement and certificate binding helpers.</summary>
    public const string ConfigurationSectionPath = "ArchLucidAuth:Saml2";

    /// <summary>Service Provider entity ID / issuer URI (maps to SAML <c>Issuer</c>).</summary>
    public string Issuer
    {
        get;
        set;
    } = "";

    /// <summary>When true, registers ITfoxtec SAML 2.0 SP authentication alongside the primary API mode (typically JWT).</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>PFX path (absolute or relative to content root) used to sign outbound AuthnRequests when the IdP requires it.</summary>
    public string SigningCertificateFile
    {
        get;
        set;
    } = "";

    public string? SigningCertificatePassword
    {
        get;
        set;
    }

    /// <summary>HTTPS URL of the IdP federation metadata document.</summary>
    public string IdPMetadata
    {
        get;
        set;
    } = "";

    /// <summary>
    ///     SAML attribute claim types whose values are copied onto short <c>roles</c> and
    ///     <see cref="System.Security.Claims.ClaimTypes.Role" /> so <see cref="Services.ArchLucidRoleClaimsTransformation" /> can resolve
    ///     ArchLucid product roles into permission claims.
    /// </summary>
    public string[] RoleClaimSources
    {
        get;
        set;
    } = [];

    /// <summary>Optional SAML attribute mapped to <c>tenant_id</c> (GUID) for scope + SCIM correlation.</summary>
    public string? TenantIdClaimType
    {
        get;
        set;
    }

    /// <summary>Optional SAML attribute mapped to <c>workspace_id</c> (GUID).</summary>
    public string? WorkspaceIdClaimType
    {
        get;
        set;
    }

    /// <summary>Optional SAML attribute mapped to <c>project_id</c> (GUID).</summary>
    public string? ProjectIdClaimType
    {
        get;
        set;
    }

    /// <summary>Optional SAML attribute mapped to <c>oid</c> for <see cref="Host.Core.Auth.Services.RoleSyncService" /> directory key.</summary>
    public string? DirectoryObjectIdClaimType
    {
        get;
        set;
    }
}
