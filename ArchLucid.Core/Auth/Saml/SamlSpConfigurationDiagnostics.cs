using System.Net;
using System.Security.Cryptography.X509Certificates;

namespace ArchLucid.Core.Auth.Saml;

/// <summary>
///     Validates SAML 2.0 SP configuration (issuer, metadata URL, signing certificate) without performing an
///     authentication protocol exchange.
/// </summary>
public static class SamlSpConfigurationDiagnostics
{
    private static readonly TimeSpan SigningCertificateExpiryWarnLeadTime = TimeSpan.FromDays(30);

    private static readonly TimeSpan MetadataValidUntilWarnLeadTime = TimeSpan.FromDays(30);

    public static async Task<IReadOnlyList<SamlTestConfigComponentResult>> EvaluateAsync(
        SamlSpConfigurationSnapshot snapshot,
        string contentRoot,
        HttpClient httpClient,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentException.ThrowIfNullOrEmpty(contentRoot);
        ArgumentNullException.ThrowIfNull(httpClient);

        if (!snapshot.Enabled)
        {
            return
            [
                new SamlTestConfigComponentResult(
                    "saml2.enabled",
                    SamlTestConfigComponentStatus.Info,
                    "ArchLucidAuth:Saml2:Enabled is false; remaining SAML SP checks were skipped."),
            ];
        }

        List<SamlTestConfigComponentResult> results =
        [
            new SamlTestConfigComponentResult(
                "saml2.enabled",
                SamlTestConfigComponentStatus.Pass,
                "ArchLucidAuth:Saml2:Enabled is true."),
        ];

        AppendIssuerCheck(results, snapshot);
        AppendSigningCertificateChecks(results, snapshot, contentRoot);
        await AppendIdpMetadataChecksAsync(results, snapshot, httpClient, cancellationToken).ConfigureAwait(false);

        return results;
    }

    private static void AppendIssuerCheck(List<SamlTestConfigComponentResult> results, SamlSpConfigurationSnapshot snapshot)
    {
        string issuer = snapshot.Issuer?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(issuer))
        {
            results.Add(new SamlTestConfigComponentResult(
                "saml2.issuer",
                SamlTestConfigComponentStatus.Fail,
                "ArchLucidAuth:Saml2:Issuer is required when SAML is enabled."));

            return;
        }

        if (!Uri.TryCreate(issuer, UriKind.Absolute, out _))
        {
            results.Add(new SamlTestConfigComponentResult(
                "saml2.issuer",
                SamlTestConfigComponentStatus.Fail,
                "ArchLucidAuth:Saml2:Issuer must be an absolute URI (SP entity ID)."));

            return;
        }

        results.Add(new SamlTestConfigComponentResult(
            "saml2.issuer",
            SamlTestConfigComponentStatus.Pass,
            "Issuer is set to an absolute URI."));
    }

    private static void AppendSigningCertificateChecks(
        List<SamlTestConfigComponentResult> results,
        SamlSpConfigurationSnapshot snapshot,
        string contentRoot)
    {
        string trimmedCertFile = snapshot.SigningCertificateFile?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(trimmedCertFile))
        {
            results.Add(new SamlTestConfigComponentResult(
                "saml2.signingCertificate",
                SamlTestConfigComponentStatus.Pass,
                "ArchLucidAuth:Saml2:SigningCertificateFile is not configured (optional unless the IdP requires SP signing)."));

            return;
        }

        try
        {
            string certPath = Path.IsPathRooted(trimmedCertFile)
                ? trimmedCertFile
                : Path.GetFullPath(Path.Combine(contentRoot, trimmedCertFile.TrimStart('/', '\\')));

            if (!File.Exists(certPath))
            {
                results.Add(new SamlTestConfigComponentResult(
                    "saml2.signingCertificate",
                    SamlTestConfigComponentStatus.Fail,
                    "Configured SAML signing certificate file was not found at the resolved path."));

                return;
            }

            using X509Certificate2 certificate = X509CertificateLoader.LoadPkcs12FromFile(
                certPath,
                snapshot.SigningCertificatePassword);

            DateTimeOffset notAfterUtc = new(certificate.NotAfter.ToUniversalTime(), TimeSpan.Zero);
            DateTimeOffset nowUtc = TimeProvider.System.GetUtcNow();

            if (notAfterUtc <= nowUtc)
            {
                results.Add(new SamlTestConfigComponentResult(
                    "saml2.signingCertificate",
                    SamlTestConfigComponentStatus.Fail,
                    $"Signing certificate expired at {notAfterUtc:O} (UTC)."));

                return;
            }

            if (notAfterUtc - nowUtc <= SigningCertificateExpiryWarnLeadTime)
            {
                results.Add(new SamlTestConfigComponentResult(
                    "saml2.signingCertificate",
                    SamlTestConfigComponentStatus.Warn,
                    $"Signing certificate expires at {notAfterUtc:O} (UTC) — within {SigningCertificateExpiryWarnLeadTime.Days} days."));

                return;
            }

            results.Add(new SamlTestConfigComponentResult(
                "saml2.signingCertificate",
                SamlTestConfigComponentStatus.Pass,
                $"Signing certificate is readable; NotAfter {notAfterUtc:O} (UTC)."));
        }
        catch (Exception)
        {
            results.Add(new SamlTestConfigComponentResult(
                "saml2.signingCertificate",
                SamlTestConfigComponentStatus.Fail,
                "Unable to load the SAML signing certificate (check path and password)."));
        }
    }

    private static async Task AppendIdpMetadataChecksAsync(
        List<SamlTestConfigComponentResult> results,
        SamlSpConfigurationSnapshot snapshot,
        HttpClient httpClient,
        CancellationToken cancellationToken)
    {
        string metadataLocation = snapshot.IdPMetadata?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(metadataLocation))
        {
            results.Add(new SamlTestConfigComponentResult(
                "saml2.idpMetadata.url",
                SamlTestConfigComponentStatus.Fail,
                "ArchLucidAuth:Saml2:IdPMetadata is required when SAML is enabled."));

            return;
        }

        if (!Uri.TryCreate(metadataLocation, UriKind.Absolute, out Uri? metadataUri)
            || metadataUri.Scheme != Uri.UriSchemeHttps)
        {
            results.Add(new SamlTestConfigComponentResult(
                "saml2.idpMetadata.url",
                SamlTestConfigComponentStatus.Fail,
                "ArchLucidAuth:Saml2:IdPMetadata must be an absolute HTTPS URL."));

            return;
        }

        results.Add(new SamlTestConfigComponentResult(
            "saml2.idpMetadata.url",
            SamlTestConfigComponentStatus.Pass,
            "IdP metadata location is an absolute HTTPS URL."));

        try
        {
            using HttpResponseMessage response =
                await httpClient.GetAsync(metadataUri, cancellationToken).ConfigureAwait(false);

            if (response.StatusCode != HttpStatusCode.OK)
            {
                results.Add(new SamlTestConfigComponentResult(
                    "saml2.idpMetadata.fetch",
                    SamlTestConfigComponentStatus.Fail,
                    $"IdP metadata HTTP {(int)response.StatusCode}."));

                return;
            }

            string xml = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            results.Add(new SamlTestConfigComponentResult(
                "saml2.idpMetadata.fetch",
                SamlTestConfigComponentStatus.Pass,
                "IdP metadata document returned HTTP 200."));

            DateTimeOffset? validUntilUtc = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

            if (validUntilUtc is null)
            {
                results.Add(new SamlTestConfigComponentResult(
                    "saml2.idpMetadata.validUntil",
                    SamlTestConfigComponentStatus.Pass,
                    "No root validUntil attribute on IdP metadata (normal for many IdPs)."));

                return;
            }

            DateTimeOffset nowUtc = TimeProvider.System.GetUtcNow();

            if (validUntilUtc <= nowUtc)
            {
                results.Add(new SamlTestConfigComponentResult(
                    "saml2.idpMetadata.validUntil",
                    SamlTestConfigComponentStatus.Fail,
                    $"IdP metadata validUntil {validUntilUtc:O} (UTC) is in the past."));

                return;
            }

            if (validUntilUtc - nowUtc <= MetadataValidUntilWarnLeadTime)
            {
                results.Add(new SamlTestConfigComponentResult(
                    "saml2.idpMetadata.validUntil",
                    SamlTestConfigComponentStatus.Warn,
                    $"IdP metadata validUntil {validUntilUtc:O} (UTC) — within {MetadataValidUntilWarnLeadTime.Days} days."));

                return;
            }

            results.Add(new SamlTestConfigComponentResult(
                "saml2.idpMetadata.validUntil",
                SamlTestConfigComponentStatus.Pass,
                $"IdP metadata validUntil {validUntilUtc:O} (UTC)."));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            results.Add(new SamlTestConfigComponentResult(
                "saml2.idpMetadata.fetch",
                SamlTestConfigComponentStatus.Fail,
                "IdP metadata could not be fetched or read."));
        }
    }
}
