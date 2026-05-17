using System.Net;
using System.Security.Cryptography.X509Certificates;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;

using ITfoxtec.Identity.Saml2.Util;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Services.Admin;

/// <inheritdoc cref="ISamlOperationalDiagnosticsService" />
public sealed class SamlOperationalDiagnosticsService(
    HttpClient httpClient,
    IOptionsMonitor<ArchLucidSamlAuthOptions> samlOptionsMonitor,
    IWebHostEnvironment webHostEnvironment) : ISamlOperationalDiagnosticsService
{
    private readonly HttpClient _httpClient =
        httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    private readonly IOptionsMonitor<ArchLucidSamlAuthOptions> _samlOptionsMonitor =
        samlOptionsMonitor ?? throw new ArgumentNullException(nameof(samlOptionsMonitor));

    private readonly IWebHostEnvironment _webHostEnvironment =
        webHostEnvironment ?? throw new ArgumentNullException(nameof(webHostEnvironment));

    /// <inheritdoc />
    public async Task<AdminSamlOperationalHealthResponse> BuildAsync(CancellationToken cancellationToken)
    {
        ArchLucidSamlAuthOptions opts = _samlOptionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return new AdminSamlOperationalHealthResponse { Saml2Enabled = false };

        (DateTimeOffset? signingNotAfterUtc, string? signingDiagnostic) = TryReadSigningCertificateNotAfterUtc(opts);

        (DateTimeOffset? metadataValidUntilUtc, string? metadataDiagnostic) =
            await TryReadIdpMetadataValidUntilUtcAsync(opts, cancellationToken).ConfigureAwait(false);

        return new AdminSamlOperationalHealthResponse
        {
            Saml2Enabled = true,
            SpSigningCertificateNotAfterUtc = signingNotAfterUtc,
            SpSigningCertificateDiagnosticSummary = signingDiagnostic,
            IdpMetadataValidUntilUtc = metadataValidUntilUtc,
            IdpMetadataDiagnosticSummary = metadataDiagnostic
        };
    }

    private (DateTimeOffset? NotAfterUtc, string? DiagnosticSummary) TryReadSigningCertificateNotAfterUtc(
        ArchLucidSamlAuthOptions opts)
    {
        string trimmedCertFile = opts.SigningCertificateFile?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(trimmedCertFile))
            return (null, "ArchLucidAuth:Saml2:SigningCertificateFile is empty.");

        try
        {
            string certPath = Path.IsPathRooted(trimmedCertFile)
                ? trimmedCertFile
                : Path.GetFullPath(Path.Combine(_webHostEnvironment.ContentRootPath, trimmedCertFile.TrimStart('/', '\\')));

            if (!File.Exists(certPath))
                return (null, "Configured SAML signing certificate file was not found at the resolved path.");

            using X509Certificate2 certificate = CertificateUtil.Load(certPath, opts.SigningCertificatePassword);

            DateTimeOffset utc = new(certificate.NotAfter.ToUniversalTime(), TimeSpan.Zero);

            return (utc, null);
        }
        catch (Exception)
        {
            return (null, "Unable to load the SAML signing certificate (check path and password).");
        }
    }

    private async Task<(DateTimeOffset? ValidUntilUtc, string? DiagnosticSummary)> TryReadIdpMetadataValidUntilUtcAsync(
        ArchLucidSamlAuthOptions opts,
        CancellationToken cancellationToken)
    {
        string metadataLocation = opts.IdPMetadata?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(metadataLocation))
            return (null, "ArchLucidAuth:Saml2:IdPMetadata is empty.");

        if (!Uri.TryCreate(metadataLocation, UriKind.Absolute, out Uri? metadataUri)
            || metadataUri.Scheme != Uri.UriSchemeHttps)
        {
            return (null, "ArchLucidAuth:Saml2:IdPMetadata must be an absolute HTTPS URL for operational metadata fetch.");
        }

        try
        {
            using HttpResponseMessage response =
                await _httpClient.GetAsync(metadataUri, cancellationToken).ConfigureAwait(false);

            if (response.StatusCode != HttpStatusCode.OK)
                return (null, $"IdP metadata HTTP {(int)response.StatusCode}.");

            string xml = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            DateTimeOffset? validUntilUtc = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

            // Missing validUntil on metadata is normal — not an error.
            return (validUntilUtc, null);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return (null, "IdP metadata could not be fetched or read.");
        }
    }
}
