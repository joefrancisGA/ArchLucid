using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Auth.Services;

public sealed class LocalTrialJwtIssuer : ILocalTrialJwtIssuer
{
    private readonly Lazy<RsaSecurityKey> _signingKey;
    private readonly IOptions<TrialAuthOptions> _trialOptions;

    public LocalTrialJwtIssuer(IOptions<TrialAuthOptions> trialOptions)
    {
        _trialOptions = trialOptions ?? throw new ArgumentNullException(nameof(trialOptions));
        _signingKey = new Lazy<RsaSecurityKey>(LoadPrivateKey);
    }

    /// <inheritdoc />
    public string IssueAccessToken(
        Guid userId,
        string email,
        string role,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? authVersion = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        TrialLocalIdentityOptions local = _trialOptions.Value.LocalIdentity;

        if (string.IsNullOrWhiteSpace(local.JwtIssuer) || string.IsNullOrWhiteSpace(local.JwtAudience))
            throw new InvalidOperationException(
                "Auth:Trial:LocalIdentity:JwtIssuer and JwtAudience must be configured.");

        SigningCredentials creds = new(_signingKey.Value, SecurityAlgorithms.RsaSha256);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        DateTimeOffset expires = now.AddMinutes(Math.Clamp(local.AccessTokenLifetimeMinutes, 5, 24 * 60));

        // Align with JwtLocalSigningIntegrationTestTokens (ArchLucid.Api.Tests): start validity well in the past so
        // GitHub-hosted runners / TestServer VMs with multi-minute UTC skew cannot reject the token at JwtBearer
        // authentication (401 before controllers run).
        DateTimeOffset notBefore = now.AddMinutes(-12);

        // Align claim shape with JwtLocalSigningIntegrationTestTokens (tests): RoleClaimType is "roles"; short JWT names only.
        Claim[] claims =
        [
            new(JwtRegisteredClaimNames.Sub, userId.ToString("D")),
            new("name", email),
            new("roles", role),
            new("tenant_id", tenantId.ToString("D")),
            new("workspace_id", workspaceId.ToString("D")),
            new("project_id", projectId.ToString("D")),
            new("auth_time", EpochSeconds(now).ToString(System.Globalization.CultureInfo.InvariantCulture)),
            new(JwtRegisteredClaimNames.Iat, EpochSeconds(now).ToString(System.Globalization.CultureInfo.InvariantCulture), ClaimValueTypes.Integer64)
        ];

        if (authVersion is { } version && version != Guid.Empty)
        {
            claims = [.. claims, new Claim(PlatformIdentityClaimTypes.AuthVersion, version.ToString("D"))];
        }

        JwtSecurityToken token = new(
            local.JwtIssuer,
            local.JwtAudience,
            claims,
            notBefore.UtcDateTime,
            expires.UtcDateTime,
            creds);

        JwtSecurityTokenHandler handler = new();

        return handler.WriteToken(token);
    }

    private static long EpochSeconds(DateTimeOffset instant) => instant.ToUnixTimeSeconds();

    private RsaSecurityKey LoadPrivateKey()
    {
        TrialLocalIdentityOptions local = _trialOptions.Value.LocalIdentity;

        return JwtPemKeyMaterial.LoadPrivateKey(local.JwtPrivateKeyPemPath, local.JwtPrivateKeyPem);
    }
}
