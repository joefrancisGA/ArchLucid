namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Operator-facing snapshot of configured JWT/OIDC settings plus optional OpenID Provider discovery metadata reachability.
/// </summary>
/// <remarks>No secrets; safe for admin troubleshooting.</remarks>
public sealed class AdminOidcDiagnosticsResponse
{
    /// <summary><see cref="ArchLucid.Api.Auth.Models.ArchLucidAuthOptions.Mode" /> value.</summary>
    public string AuthMode
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Configured <c>ArchLucidAuth:Authority</c> when present.</summary>
    public string? ConfiguredAuthority
    {
        get;
        set;
    }

    /// <summary>Configured <c>ArchLucidAuth:Audience</c> when present.</summary>
    public string? ConfiguredAudience
    {
        get;
        set;
    }

    /// <summary>
    ///     True when <see cref="ArchLucid.Api.Auth.Models.ArchLucidAuthOptions.JwtSigningPublicKeyPemPath" /> selects local PEM validation (no OIDC metadata).
    /// </summary>
    public bool UsesLocalJwtSigningKey
    {
        get;
        set;
    }

    /// <summary>Effective issuer when <see cref="UsesLocalJwtSigningKey" /> is true.</summary>
    public string? LocalJwtIssuer
    {
        get;
        set;
    }

    /// <summary>Effective audience when <see cref="UsesLocalJwtSigningKey" /> is true.</summary>
    public string? LocalJwtAudience
    {
        get;
        set;
    }

    /// <summary>Optional human-readable explanation when discovery was skipped or failed.</summary>
    public string? DiagnosticSummary
    {
        get;
        set;
    }

    /// <summary>Whether an HTTP GET to OpenID discovery was attempted.</summary>
    public bool DiscoveryAttempted
    {
        get;
        set;
    }

    /// <summary>Absolute discovery document URL when <see cref="DiscoveryAttempted" /> is true.</summary>
    public string? OpenIdConfigurationUrl
    {
        get;
        set;
    }

    /// <summary>Null when discovery was not attempted or incomplete; true when HTTP OK and JSON parsed.</summary>
    public bool? DiscoverySucceeded
    {
        get;
        set;
    }

    /// <summary>Stable operator-facing error when discovery fails (HTTP errors, timeouts, invalid JSON).</summary>
    public string? DiscoveryError
    {
        get;
        set;
    }

    /// <summary><c>issuer</c> from the discovery document when available.</summary>
    public string? IssuerFromDiscovery
    {
        get;
        set;
    }

    public string? AuthorizationEndpoint
    {
        get;
        set;
    }

    public string? TokenEndpoint
    {
        get;
        set;
    }

    public string? JwksUri
    {
        get;
        set;
    }

    public string? UserinfoEndpoint
    {
        get;
        set;
    }
}
