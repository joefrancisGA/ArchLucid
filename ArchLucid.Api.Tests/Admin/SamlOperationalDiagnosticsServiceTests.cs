using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Admin;

/// <summary>Unit coverage for <see cref="SamlOperationalDiagnosticsService" /> certificate + metadata parsing paths.</summary>
[Trait("Suite", "Core")]
public sealed class SamlOperationalDiagnosticsServiceTests
{
    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder =
            responder ?? throw new ArgumentNullException(nameof(responder));

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(_responder(request));
    }

    [Fact]
    public async Task BuildAsync_when_disabled_returns_only_flag()
    {
        Mock<IOptionsMonitor<ArchLucidSamlAuthOptions>> monitor = new();
        monitor.Setup(static m => m.CurrentValue).Returns(new ArchLucidSamlAuthOptions { Enabled = false });

        Mock<IWebHostEnvironment> env = new();
        HttpClient httpClient = new(new StubHttpMessageHandler(_ =>
            throw new InvalidOperationException("HTTP must not be invoked when SAML is disabled.")));

        SamlOperationalDiagnosticsService sut = new(httpClient, monitor.Object, env.Object);

        AdminSamlOperationalHealthResponse response = await sut.BuildAsync(CancellationToken.None);

        response.Saml2Enabled.Should().BeFalse();
        response.SpSigningCertificateNotAfterUtc.Should().BeNull();
        response.IdpMetadataValidUntilUtc.Should().BeNull();
    }

    [Fact]
    public async Task BuildAsync_when_enabled_reads_signing_certificate_and_metadata_valid_until()
    {
        string tempDirectory = Path.Combine(Path.GetTempPath(), $"archlucid-saml-diag-{Guid.NewGuid():N}");

        try
        {
            Directory.CreateDirectory(tempDirectory);
            string pfxPath = Path.Combine(tempDirectory, "sp-signing.pfx");
            WriteSelfSignedPfx(pfxPath, "pfx-password", DateTimeOffset.UtcNow.AddDays(90));

            Mock<IOptionsMonitor<ArchLucidSamlAuthOptions>> monitor = new();
            monitor.Setup(static m => m.CurrentValue).Returns(
                new ArchLucidSamlAuthOptions
                {
                    Enabled = true,
                    SigningCertificateFile = pfxPath,
                    SigningCertificatePassword = "pfx-password",
                    IdPMetadata = "https://metadata.example.invalid/saml",
                });

            Mock<IWebHostEnvironment> env = new();
            env.Setup(static e => e.ContentRootPath).Returns(tempDirectory);

            HttpClient httpClient = new(new StubHttpMessageHandler(req =>
            {
                req.RequestUri.Should().Be(new Uri("https://metadata.example.invalid/saml"));

                const string xml =
                    "<EntityDescriptor xmlns=\"urn:oasis:names:tc:SAML:2.0:metadata\" validUntil=\"2036-06-01T00:00:00Z\" />";

                return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent(xml),
                };
            }));

            SamlOperationalDiagnosticsService sut = new(httpClient, monitor.Object, env.Object);

            AdminSamlOperationalHealthResponse response = await sut.BuildAsync(CancellationToken.None);

            response.Saml2Enabled.Should().BeTrue();
            response.SpSigningCertificateNotAfterUtc.Should().NotBeNull();
            response.SpSigningCertificateDiagnosticSummary.Should().BeNull();
            response.IdpMetadataValidUntilUtc.Should().Be(DateTimeOffset.Parse("2036-06-01T00:00:00Z", System.Globalization.CultureInfo.InvariantCulture));
            response.IdpMetadataDiagnosticSummary.Should().BeNull();
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
            new("CN=archlucid-saml-operational-health-test", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        DateTimeOffset start = DateTimeOffset.UtcNow.AddDays(-1);

        using X509Certificate2 certificate = request.CreateSelfSigned(start, notAfterUtc);

        byte[] pfxBytes = certificate.Export(X509ContentType.Pfx, password);

        File.WriteAllBytes(absolutePath, pfxBytes);
    }
}
