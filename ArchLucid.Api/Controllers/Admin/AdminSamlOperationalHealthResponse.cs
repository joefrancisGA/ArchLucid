namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Operator-facing SAML 2.0 SP operational snapshot (signing certificate expiry and optional IdP metadata
///     <c>validUntil</c>). No secrets or private keys.
/// </summary>
public sealed record AdminSamlOperationalHealthResponse
{
    /// <summary>Effective <c>ArchLucidAuth:Saml2:Enabled</c>.</summary>
    public bool Saml2Enabled { get; init; }

    /// <summary>
    ///     UTC expiry of the configured SP signing certificate when readable; null when SAML is disabled or loading the
    ///     certificate failed.
    /// </summary>
    public DateTimeOffset? SpSigningCertificateNotAfterUtc { get; init; }

    /// <summary>Optional root metadata <c>validUntil</c> when present on fetched IdP metadata XML.</summary>
    public DateTimeOffset? IdpMetadataValidUntilUtc { get; init; }

    /// <summary>Explanation when signing certificate material cannot be read (never contains passwords or PEM/PFX contents).</summary>
    public string? SpSigningCertificateDiagnosticSummary { get; init; }

    /// <summary>Optional explanation when metadata fetch/parsing did not yield <see cref="IdpMetadataValidUntilUtc" />.</summary>
    public string? IdpMetadataDiagnosticSummary { get; init; }
}
