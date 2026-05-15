namespace ArchLucid.Api.Auth.Models;

/// <summary>
///     Optional SAML 2.0 SP settings under <c>ArchLucidAuth:Saml2</c>. <c>Issuer</c> and other SP fields bind to
///     <c>Saml2Configuration</c> when present in the same JSON section.
/// </summary>
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
}
