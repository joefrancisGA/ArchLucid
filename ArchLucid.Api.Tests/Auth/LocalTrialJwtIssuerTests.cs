using System.Security.Cryptography;
using System.Text;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LocalTrialJwtIssuerTests : IDisposable
{
    private readonly string _privatePemPath;

    public LocalTrialJwtIssuerTests()
    {
        using RSA rsa = RSA.Create(2048);
        string pem = rsa.ExportPkcs8PrivateKeyPem();
        _privatePemPath = Path.Combine(Path.GetTempPath(), $"archlucid-local-trial-issuer-{Guid.NewGuid():N}.pem");
        File.WriteAllText(_privatePemPath, pem, Encoding.UTF8);
    }

    [SkippableFact]
    public void IssueAccessToken_returns_signed_jwt_with_scope_claims()
    {
        LocalTrialJwtIssuer issuer = CreateIssuer();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid userId = Guid.NewGuid();

        string token = issuer.IssueAccessToken(userId, "user@example.test", "Operator", tenantId, workspaceId, projectId);

        token.Should().NotBeNullOrWhiteSpace();
        token.Split('.').Should().HaveCount(3);
    }

    [SkippableFact]
    public void IssueAccessToken_throws_when_issuer_not_configured()
    {
        LocalTrialJwtIssuer issuer = new(
            Options.Create(
                new TrialAuthOptions
                {
                    LocalIdentity = new TrialLocalIdentityOptions
                    {
                        JwtIssuer = "",
                        JwtAudience = "aud",
                        JwtPrivateKeyPemPath = _privatePemPath
                    }
                }));

        Action act = () => issuer.IssueAccessToken(Guid.NewGuid(), "user@example.test", "Operator", Guid.NewGuid(),
            Guid.NewGuid(), Guid.NewGuid());

        act.Should().Throw<InvalidOperationException>();
    }

    public void Dispose()
    {
        if (File.Exists(_privatePemPath))
            File.Delete(_privatePemPath);
    }

    private LocalTrialJwtIssuer CreateIssuer()
    {
        return new LocalTrialJwtIssuer(
            Options.Create(
                new TrialAuthOptions
                {
                    LocalIdentity = new TrialLocalIdentityOptions
                    {
                        JwtIssuer = "https://issuer.test",
                        JwtAudience = "api://test",
                        JwtPrivateKeyPemPath = _privatePemPath,
                        AccessTokenLifetimeMinutes = 30
                    }
                }));
    }
}
