using System.Security.Claims;

namespace ArchLucid.Api.Auth.Models;

public class ArchLucidAuthOptions
{
    public const string SectionName = "ArchLucidAuth";

    /// <summary>DevelopmentBypass | JwtBearer | ApiKey</summary>
    public string Mode { get; set; } = "DevelopmentBypass";
    public string Authority { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;

    /// <summary>
    /// Claim type used as the user name after JWT validation. Entra ID tokens often use
    /// <c>preferred_username</c> or <c>name</c>; default matches classic <see cref="ClaimTypes.Name"/>.
    /// </summary>
    public string NameClaimType { get; set; } = ClaimTypes.Name;
    public string DevUserId { get; set; } = "dev-user";
    public string DevUserName { get; set; } = "Developer";

    /// <summary>Admin | Operator | Reader</summary>
    public string DevRole { get; set; } = "Admin";

    /// <summary>
    /// Path to a PEM file containing an RSA <strong>public</strong> key for JWT signature validation.
    /// When set, OIDC metadata from <see cref="Authority"/> is not used (CI / local signing-key E2E only).
    /// </summary>
    public string JwtSigningPublicKeyPemPath { get; set; } = string.Empty;

    /// <summary><c>iss</c> claim value when using <see cref="JwtSigningPublicKeyPemPath"/>.</summary>
    public string JwtLocalIssuer { get; set; } = string.Empty;

    /// <summary><c>aud</c> claim value when using <see cref="JwtSigningPublicKeyPemPath"/>.</summary>
    public string JwtLocalAudience { get; set; } = string.Empty;
}
