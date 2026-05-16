using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

using ArchLucid.Core.Configuration;

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
    public string IssueAccessToken(Guid userId, string email, string role, Guid tenantId, Guid workspaceId,
        Guid projectId)
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

        // Align with CI/local PEM JWT integration tests: start validity slightly in the past so small host/vm clock
        // skew cannot reject the token at Authentication (401) while identical Reader tokens still validate.
        DateTimeOffset notBefore = now.AddMinutes(-2);

        Claim[] claims =
        [
            new(JwtRegisteredClaimNames.Sub, userId.ToString("D")),
            new(JwtRegisteredClaimNames.Email, email),
            new("name", email),
            new(ClaimTypes.Role, role),
            new("roles", role),
            new("tenant_id", tenantId.ToString("D")),
            new("workspace_id", workspaceId.ToString("D")),
            new("project_id", projectId.ToString("D"))
        ];

        JwtSecurityToken token = new(
            local.JwtIssuer,
            local.JwtAudience,
            claims,
            notBefore.UtcDateTime,
            expires.UtcDateTime,
            creds);

        JwtSecurityTokenHandler handler = new() { MapInboundClaims = false };

        return handler.WriteToken(token);
    }

    private RsaSecurityKey LoadPrivateKey()
    {
        TrialLocalIdentityOptions local = _trialOptions.Value.LocalIdentity;
        string path = local.JwtPrivateKeyPemPath.Trim();

        if (string.IsNullOrEmpty(path))
            throw new InvalidOperationException("Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath is not configured.");

        string resolved = Path.IsPathRooted(path)
            ? path
            : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), path));

        if (!File.Exists(resolved))
            throw new InvalidOperationException(
                $"Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath points to a missing file: '{resolved}'.");

        string pem = File.ReadAllText(resolved);

        using RSA rsa = RSA.Create();

        rsa.ImportFromPem(pem);

        return new RsaSecurityKey(rsa.ExportParameters(true));
    }
}
