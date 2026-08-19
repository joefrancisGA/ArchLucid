namespace ArchLucid.Core.Auth.Saml;

/// <summary>
///     SAML 2.0 SP settings read from <c>ArchLucidAuth:Saml2</c> for offline configuration validation (CLI and API
///     diagnostics). Not used by the authentication middleware.
/// </summary>
public sealed class SamlSpConfigurationSnapshot
{
    /// <summary>Configuration section path (<c>ArchLucidAuth:Saml2</c>).</summary>
    public const string ConfigurationSectionPath = "ArchLucidAuth:Saml2";

    public bool Enabled { get; init; }

    public string Issuer { get; init; } = "";

    public string IdPMetadata { get; init; } = "";

    public string SigningCertificateFile { get; init; } = "";

    public string? SigningCertificatePassword { get; init; }
}
