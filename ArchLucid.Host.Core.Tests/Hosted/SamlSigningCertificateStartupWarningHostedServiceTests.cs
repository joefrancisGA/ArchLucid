using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
public sealed class SamlSigningCertificateStartupWarningHostedServiceTests
{
    [Fact]
    public async Task StartAsync_when_cert_expires_within_30_days_logs_warning()
    {
        string tempDirectory = Path.Combine(Path.GetTempPath(), $"archlucid-saml-startup-{Guid.NewGuid():N}");

        try
        {
            Directory.CreateDirectory(tempDirectory);
            string pfxPath = Path.Combine(tempDirectory, "sp-signing.pfx");
            WriteSelfSignedPfx(pfxPath, "pfx-password", DateTimeOffset.UtcNow.AddDays(10));

            List<string> warnings = await RunStartupWarningsAsync(tempDirectory, pfxPath, "pfx-password");

            warnings.Should().Contain(message => message.Contains("SAML SP signing certificate expires", StringComparison.Ordinal));
        }
        finally
        {
            if (Directory.Exists(tempDirectory))
                Directory.Delete(tempDirectory, recursive: true);
        }
    }

    [Fact]
    public async Task StartAsync_when_cert_file_absent_logs_warning()
    {
        string tempDirectory = Path.Combine(Path.GetTempPath(), $"archlucid-saml-startup-{Guid.NewGuid():N}");

        try
        {
            Directory.CreateDirectory(tempDirectory);
            string missingPath = Path.Combine(tempDirectory, "missing-signing.pfx");

            List<string> warnings = await RunStartupWarningsAsync(tempDirectory, missingPath, "pfx-password");

            warnings.Should().Contain(message => message.Contains("SAML signing certificate file not found", StringComparison.Ordinal));
        }
        finally
        {
            if (Directory.Exists(tempDirectory))
                Directory.Delete(tempDirectory, recursive: true);
        }
    }

    [Fact]
    public async Task StartAsync_when_cert_valid_beyond_30_days_logs_no_warning()
    {
        string tempDirectory = Path.Combine(Path.GetTempPath(), $"archlucid-saml-startup-{Guid.NewGuid():N}");

        try
        {
            Directory.CreateDirectory(tempDirectory);
            string pfxPath = Path.Combine(tempDirectory, "sp-signing.pfx");
            WriteSelfSignedPfx(pfxPath, "pfx-password", DateTimeOffset.UtcNow.AddDays(120));

            List<string> warnings = await RunStartupWarningsAsync(tempDirectory, pfxPath, "pfx-password");

            warnings.Should().BeEmpty();
        }
        finally
        {
            if (Directory.Exists(tempDirectory))
                Directory.Delete(tempDirectory, recursive: true);
        }
    }

    [Fact]
    public async Task StartAsync_when_cert_expired_logs_warning()
    {
        string tempDirectory = Path.Combine(Path.GetTempPath(), $"archlucid-saml-startup-{Guid.NewGuid():N}");

        try
        {
            Directory.CreateDirectory(tempDirectory);
            string pfxPath = Path.Combine(tempDirectory, "sp-signing.pfx");
            WriteSelfSignedPfx(pfxPath, "pfx-password", DateTimeOffset.UtcNow.AddDays(-1));

            List<string> warnings = await RunStartupWarningsAsync(tempDirectory, pfxPath, "pfx-password");

            warnings.Should().Contain(message => message.Contains("SAML SP signing certificate expires", StringComparison.Ordinal));
        }
        finally
        {
            if (Directory.Exists(tempDirectory))
                Directory.Delete(tempDirectory, recursive: true);
        }
    }

    private static async Task<List<string>> RunStartupWarningsAsync(
        string contentRootPath,
        string certFilePath,
        string certPassword)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Saml2:Enabled"] = "true",
                ["ArchLucidAuth:Saml2:SigningCertificateFile"] = certFilePath,
                ["ArchLucidAuth:Saml2:SigningCertificatePassword"] = certPassword,
            })
            .Build();

        FakeWebHostEnvironment environment = new(contentRootPath);
        FakeTimeProvider timeProvider = new(DateTimeOffset.UtcNow);

        List<string> warnings = [];
        ILogger<SamlSigningCertificateStartupWarningHostedService> logger =
            new CollectingLogger<SamlSigningCertificateStartupWarningHostedService>(warnings);

        SamlSigningCertificateStartupWarningHostedService sut = new(
            configuration,
            environment,
            timeProvider,
            logger);

        await sut.StartAsync(CancellationToken.None);

        return warnings;
    }

    private static void WriteSelfSignedPfx(string absolutePath, string password, DateTimeOffset notAfterUtc)
    {
        using RSA rsa = RSA.Create(keySizeInBits: 2048);

        CertificateRequest request =
            new("CN=archlucid-saml-startup-warning-test", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        // notBefore must be strictly before notAfter (expired certs pass notAfter in the past).
        DateTimeOffset start = notAfterUtc.AddYears(-1);

        using X509Certificate2 certificate = request.CreateSelfSigned(start, notAfterUtc);

        byte[] pfxBytes = certificate.Export(X509ContentType.Pfx, password);

        File.WriteAllBytes(absolutePath, pfxBytes);
    }

    private sealed class FakeWebHostEnvironment(string contentRootPath) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "tests";

        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();

        public string WebRootPath { get; set; } = contentRootPath;

        public string EnvironmentName { get; set; } = Environments.Development;

        public string ContentRootPath { get; set; } = contentRootPath;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private sealed class CollectingLogger<T>(List<string> messages) : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => NullDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Warning;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (!IsEnabled(logLevel))
                return;

            messages.Add(formatter(state, exception));
        }

        private sealed class NullDisposable : IDisposable
        {
            public static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
