using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

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

    [Fact]
    public void IssueAccessToken_uses_local_identity_lifetime_when_caller_omits_minutes()
    {
        LocalTrialJwtIssuer issuer = CreateIssuer();
        string token = issuer.IssueAccessToken(
            Guid.NewGuid(),
            "user@example.test",
            "Operator",
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid());

        JwtSecurityToken jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        long expUnix = long.Parse(jwt.Claims.Single(claim => claim.Type == "exp").Value, System.Globalization.CultureInfo.InvariantCulture);
        long remainingSeconds = expUnix - DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        remainingSeconds.Should().BeCloseTo(30 * 60, 30);
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

    [SkippableFact]
    public void IssueAccessToken_throws_when_email_is_whitespace_only()
    {
        LocalTrialJwtIssuer issuer = CreateIssuer();

        Action act = () => issuer.IssueAccessToken(
            Guid.NewGuid(),
            "   ",
            "Operator",
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid());

        act.Should().Throw<ArgumentException>();
    }

    [SkippableFact]
    public void IssueAccessToken_throws_when_role_is_whitespace_only()
    {
        LocalTrialJwtIssuer issuer = CreateIssuer();

        Action act = () => issuer.IssueAccessToken(
            Guid.NewGuid(),
            "user@example.test",
            "   ",
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid());

        act.Should().Throw<ArgumentException>();
    }

    [SkippableFact]
    public void IssueAccessToken_omits_auth_version_claim_when_auth_version_is_empty_guid()
    {
        LocalTrialJwtIssuer issuer = CreateIssuer();
        Guid userId = Guid.NewGuid();

        string token = issuer.IssueAccessToken(
            userId,
            "user@example.test",
            "Operator",
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            authVersion: Guid.Empty);

        JwtSecurityToken jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Claims.Should().NotContain(c => c.Type == PlatformIdentityClaimTypes.AuthVersion);
    }

    [SkippableFact]
    public void IssueAccessToken_clamps_requested_access_token_lifetime_above_twenty_four_hours()
    {
        LocalTrialJwtIssuer issuer = CreateIssuer();

        string token = issuer.IssueAccessToken(
            Guid.NewGuid(),
            "user@example.test",
            "Operator",
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            accessTokenLifetimeMinutes: 2000);

        JwtSecurityToken jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        long expUnix = long.Parse(jwt.Claims.Single(claim => claim.Type == "exp").Value, System.Globalization.CultureInfo.InvariantCulture);
        long remainingSeconds = expUnix - DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        remainingSeconds.Should().BeCloseTo(24 * 60 * 60, 120);
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
