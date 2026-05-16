using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

using ArchLucid.Core.Scoping;

using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Tests;

/// <summary>
///     JWTs for <see cref="JwtLocalSigningWebAppFactory" /> — PEM-signed access tokens with scope claims; uses a
///     deeper <c>notBefore</c> skew than <see cref="ArchLucid.Api.Auth.Services.LocalTrialJwtIssuer" /> so CI/TestServer
///     clock drift cannot fail JwtBearer authentication (401) before controllers run.
/// </summary>
internal static class JwtLocalSigningIntegrationTestTokens
{
    internal static string MintBearerJwt(
        string privatePkcs8Pem,
        string issuer,
        string audience,
        string name,
        IReadOnlyList<string> roles) =>
        MintBearerJwt(
            privatePkcs8Pem,
            issuer,
            audience,
            name,
            roles,
            ScopeIds.DefaultTenant,
            ScopeIds.DefaultWorkspace,
            ScopeIds.DefaultProject);

    internal static string MintBearerJwt(
        string privatePkcs8Pem,
        string issuer,
        string audience,
        string name,
        IReadOnlyList<string> roles,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        using RSA rsa = RSA.Create();
        rsa.ImportFromPem(privatePkcs8Pem);
        RSAParameters keyMaterial = rsa.ExportParameters(true);
        RsaSecurityKey signingKey = new(keyMaterial);
        SigningCredentials creds = new(signingKey, SecurityAlgorithms.RsaSha256);

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, "test-sub"),
            new("name", name),
            new("tenant_id", tenantId.ToString("D")),
            new("workspace_id", workspaceId.ToString("D")),
            new("project_id", projectId.ToString("D"))
        ];

        claims.AddRange(roles.Select(r => new Claim("roles", r)));

        // Match JwtBearer ClockSkew for local PEM signing (ArchLucidJwtBearerConfiguration.ApplyWithLocalPublicKey): stay
        // further in the past than LocalTrialJwtIssuer so GitHub-hosted runners/TestServer VMs with multi-minute UTC skew
        // cannot intermittently reject tokens as "not yet valid" (authentication returns 401 before controllers run).
        DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;
        DateTime notBefore = utcNow.AddMinutes(-12);
        DateTime expires = utcNow.AddHours(1);

        JwtSecurityTokenHandler handler = new();
        JwtSecurityToken token = new(
            issuer,
            audience,
            claims,
            notBefore,
            expires,
            creds);

        return handler.WriteToken(token);
    }
}
