using System.Security.Cryptography;
using System.Text;

using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthBetaReadinessDiagnosticsEvaluatorTests : IDisposable
{
    private readonly string _privatePemPath;

    public AuthBetaReadinessDiagnosticsEvaluatorTests()
    {
        using RSA rsa = RSA.Create(2048);
        string pem = rsa.ExportPkcs8PrivateKeyPem();
        _privatePemPath = Path.Combine(Path.GetTempPath(), $"archlucid-beta-readiness-{Guid.NewGuid():N}.pem");
        File.WriteAllText(_privatePemPath, pem, Encoding.UTF8);
    }

    [Fact]
    public void Evaluate_reports_operator_base_url_and_local_identity_readiness()
    {
        (bool operatorBaseUrlConfigured, bool localTrialIdentityConfigured) =
            AuthBetaReadinessDiagnosticsEvaluator.Evaluate(
                new EmailNotificationOptions { OperatorBaseUrl = "https://app.example.com" },
                new TrialAuthOptions
                {
                    LocalIdentity = new TrialLocalIdentityOptions
                    {
                        JwtIssuer = "https://issuer.test",
                        JwtAudience = "api://test",
                        JwtPrivateKeyPemPath = _privatePemPath,
                    },
                });

        operatorBaseUrlConfigured.Should().BeTrue();
        localTrialIdentityConfigured.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_flags_missing_operator_base_url_and_local_identity()
    {
        (bool operatorBaseUrlConfigured, bool localTrialIdentityConfigured) =
            AuthBetaReadinessDiagnosticsEvaluator.Evaluate(
                new EmailNotificationOptions(),
                new TrialAuthOptions { LocalIdentity = new TrialLocalIdentityOptions() });

        operatorBaseUrlConfigured.Should().BeFalse();
        localTrialIdentityConfigured.Should().BeFalse();
    }

    [Fact]
    public void IsLocalTrialJwtMisconfiguration_recognizes_local_identity_errors()
    {
        InvalidOperationException ex = new("Auth:Trial:LocalIdentity:JwtIssuer and JwtAudience must be configured.");

        AuthBetaReadinessDiagnosticsEvaluator.IsLocalTrialJwtMisconfiguration(ex).Should().BeTrue();
    }

    public void Dispose()
    {
        if (File.Exists(_privatePemPath))
            File.Delete(_privatePemPath);
    }
}
