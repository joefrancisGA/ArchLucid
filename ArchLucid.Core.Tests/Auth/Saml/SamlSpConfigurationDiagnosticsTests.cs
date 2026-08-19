using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

using ArchLucid.Core.Auth.Saml;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Auth.Saml;

[Trait("Suite", "Core")]
public sealed class SamlSpConfigurationDiagnosticsTests
{
    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder =
            responder ?? throw new ArgumentNullException(nameof(responder));

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(_responder(request));
    }

    [Fact]
    public async Task EvaluateAsync_when_disabled_returns_info_only()
    {
        HttpClient httpClient = new(new StubHttpMessageHandler(_ =>
            throw new InvalidOperationException("HTTP must not be invoked when SAML is disabled.")));

        IReadOnlyList<SamlTestConfigComponentResult> results = await SamlSpConfigurationDiagnostics.EvaluateAsync(
            new SamlSpConfigurationSnapshot { Enabled = false },
            contentRoot: Directory.GetCurrentDirectory(),
            httpClient,
            CancellationToken.None);

        results.Should().ContainSingle();
        results[0].Component.Should().Be("saml2.enabled");
        results[0].Status.Should().Be(SamlTestConfigComponentStatus.Info);
    }

    [Fact]
    public async Task EvaluateAsync_when_enabled_validates_signing_certificate_and_metadata()
    {
        string tempDirectory = Path.Combine(Path.GetTempPath(), $"archlucid-saml-cli-{Guid.NewGuid():N}");

        try
        {
            Directory.CreateDirectory(tempDirectory);
            string pfxPath = Path.Combine(tempDirectory, "sp-signing.pfx");
            WriteSelfSignedPfx(pfxPath, "pfx-password", DateTimeOffset.UtcNow.AddDays(90));

            HttpClient httpClient = new(new StubHttpMessageHandler(req =>
            {
                req.RequestUri.Should().Be(new Uri("https://metadata.example.invalid/saml"));

                const string xml =
                    "<EntityDescriptor xmlns=\"urn:oasis:names:tc:SAML:2.0:metadata\" validUntil=\"2036-06-01T00:00:00Z\" />";

                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(xml) };
            }));

            SamlSpConfigurationSnapshot snapshot = new()
            {
                Enabled = true,
                Issuer = "https://sp.example.invalid/entity",
                SigningCertificateFile = pfxPath,
                SigningCertificatePassword = "pfx-password",
                IdPMetadata = "https://metadata.example.invalid/saml",
            };

            IReadOnlyList<SamlTestConfigComponentResult> results = await SamlSpConfigurationDiagnostics.EvaluateAsync(
                snapshot,
                tempDirectory,
                httpClient,
                CancellationToken.None);

            results.Should().Contain(r => r.Component == "saml2.enabled" && r.Status == SamlTestConfigComponentStatus.Pass);
            results.Should().Contain(r => r.Component == "saml2.issuer" && r.Status == SamlTestConfigComponentStatus.Pass);
            results.Should().Contain(r => r.Component == "saml2.signingCertificate" && r.Status == SamlTestConfigComponentStatus.Pass);
            results.Should().Contain(r => r.Component == "saml2.idpMetadata.fetch" && r.Status == SamlTestConfigComponentStatus.Pass);
            results.Should().Contain(r => r.Component == "saml2.idpMetadata.validUntil" && r.Status == SamlTestConfigComponentStatus.Pass);
        }
        finally
        {
            if (Directory.Exists(tempDirectory))
                Directory.Delete(tempDirectory, recursive: true);
        }
    }

    private static void WriteSelfSignedPfx(string absolutePath, string password, DateTimeOffset notAfterUtc)
    {
        using RSA rsa = RSA.Create(keySizeInBits: 2048);

        CertificateRequest request =
            new("CN=archlucid-saml-test-config", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        DateTimeOffset start = DateTimeOffset.UtcNow.AddDays(-1);

        using X509Certificate2 certificate = request.CreateSelfSigned(start, notAfterUtc);

        byte[] pfxBytes = certificate.Export(X509ContentType.Pfx, password);

        File.WriteAllBytes(absolutePath, pfxBytes);
    }
}
