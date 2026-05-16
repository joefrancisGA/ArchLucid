using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

using ArchLucid.Core.Scoping;

using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Tests;

/// <summary>
///     JWTs for <see cref="JwtLocalSigningWebAppFactory" /> — aligned with <see cref="ArchLucid.Api.Auth.Services.LocalTrialJwtIssuer" />
///     (notBefore skew) and typical ArchLucid access-token scope claims.
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

        // Match LocalTrialJwtIssuer: extra past skew so host/vm clock drift cannot fail Authentication (401).
        DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;
        DateTime notBefore = utcNow.AddMinutes(-2);
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
