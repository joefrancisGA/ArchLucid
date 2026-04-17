using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Auth.Services;

public sealed class LocalTrialJwtIssuer : ILocalTrialJwtIssuer
{
    private readonly IOptions<TrialAuthOptions> _trialOptions;

    private readonly Lazy<RsaSecurityKey> _signingKey;

    public LocalTrialJwtIssuer(IOptions<TrialAuthOptions> trialOptions)
    {
        _trialOptions = trialOptions ?? throw new ArgumentNullException(nameof(trialOptions));
        _signingKey = new Lazy<RsaSecurityKey>(LoadPrivateKey);
    }

    /// <inheritdoc />
    public string IssueAccessToken(Guid userId, string email, string role, Guid tenantId, Guid workspaceId, Guid projectId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        TrialLocalIdentityOptions local = _trialOptions.Value.LocalIdentity;

        if (string.IsNullOrWhiteSpace(local.JwtIssuer) || string.IsNullOrWhiteSpace(local.JwtAudience))
            throw new InvalidOperationException("Auth:Trial:LocalIdentity:JwtIssuer and JwtAudience must be configured.");

        SigningCredentials creds = new(_signingKey.Value, SecurityAlgorithms.RsaSha256);

        DateTimeOffset now = DateTimeOffset.UtcNow;
        DateTimeOffset expires = now.AddMinutes(Math.Clamp(local.AccessTokenLifetimeMinutes, 5, 24 * 60));

        Claim[] claims =
        [
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString("D")),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("name", email),
            new Claim(ClaimTypes.Role, role),
            new Claim("roles", role),
            new Claim("tenant_id", tenantId.ToString("D")),
            new Claim("workspace_id", workspaceId.ToString("D")),
            new Claim("project_id", projectId.ToString("D")),
        ];

        JwtSecurityToken token = new(
            issuer: local.JwtIssuer,
            audience: local.JwtAudience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expires.UtcDateTime,
            signingCredentials: creds);

        JwtSecurityTokenHandler handler = new() { MapInboundClaims = false };

        return handler.WriteToken(token);
    }

    private RsaSecurityKey LoadPrivateKey()
    {
        TrialLocalIdentityOptions local = _trialOptions.Value.LocalIdentity;
        string path = local.JwtPrivateKeyPemPath?.Trim() ?? string.Empty;

        if (string.IsNullOrEmpty(path))
            throw new InvalidOperationException("Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath is not configured.");

        string resolved = Path.IsPathRooted(path) ? path : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), path));

        if (!File.Exists(resolved))
            throw new InvalidOperationException($"Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath points to a missing file: '{resolved}'.");

        string pem = File.ReadAllText(resolved);

        using RSA rsa = RSA.Create();

        rsa.ImportFromPem(pem);

        return new RsaSecurityKey(rsa.ExportParameters(true));
    }
}
