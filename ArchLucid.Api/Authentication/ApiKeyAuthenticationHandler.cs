using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;

using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Authentication;

/// <summary>
///     API key authentication. When <c>Authentication:ApiKey:Enabled</c> is false, authentication fails closed
///     unless <c>Authentication:ApiKey:DevelopmentBypassAll</c> is true in a non-Production environment
///     (explicit opt-in for local development only; blocked in Production by API startup and
///     <see cref="ArchLucid.Host.Core.Startup.Validation.ArchLucidConfigurationRules" />).
/// </summary>
/// <remarks>
///     Key material is read from <see cref="IOptionsMonitor{ApiKeyAuthenticationOptions}" /> so configuration reload
///     (e.g. Key Vault rotation) can take effect without restarting the process.
/// </remarks>
public class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptionsMonitor<ApiKeyAuthenticationOptions> apiKeyOptions,
    IHostEnvironment environment,
    TimeProvider timeProvider)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        ApiKeyAuthenticationOptions keys = apiKeyOptions.CurrentValue;
        bool enabled = keys.Enabled;
        bool developmentBypassAll = keys.DevelopmentBypassAll;

        // Previously, Enabled=false authenticated every request as a synthetic admin-equivalent principal. That meant
        // any host misconfigured with ArchLucidAuth:Mode=ApiKey but keys "off" silently granted full access to anonymous callers.
        if (!enabled)
        {
            if (!developmentBypassAll)
                return Task.FromResult(
                    AuthenticateResult.Fail(
                        "API key authentication is disabled. Set Authentication:ApiKey:Enabled to true and configure keys, " +
                        "or set Authentication:ApiKey:DevelopmentBypassAll=true only in non-Production for intentional open access."));

            if (environment.IsProduction())
                return Task.FromResult(
                    AuthenticateResult.Fail(
                        "Authentication:ApiKey:DevelopmentBypassAll is not allowed in Production."));

            ClaimsIdentity bypassIdentity = new(
                BuildSyntheticAdminClaims(),
                Scheme.Name);
            ClaimsPrincipal bypassPrincipal = new(bypassIdentity);
            AuthenticationTicket bypassTicket = new(bypassPrincipal, Scheme.Name);

            return Task.FromResult(AuthenticateResult.Success(bypassTicket));
        }

        if (!Request.Headers.TryGetValue("X-Api-Key", out StringValues providedKey))
            return Task.FromResult(AuthenticateResult.Fail("API key header 'X-Api-Key' is missing."));

        string key = providedKey.ToString();

        string? adminKeyRaw = keys.AdminKey;
        string? readerKeyRaw = keys.ReadOnlyKey;

        string? userName;
        Claim[] claims;

        if (MatchesAnyCommaSeparatedKey(key, adminKeyRaw))
        {
            if (IsKeyExpired(keys.AdminKeyExpiresAt))
                return Task.FromResult(AuthenticateResult.Fail(
                    "The admin API key has expired. Rotate the key and update Authentication:ApiKey:AdminKey."));

            userName = "ApiKeyAdmin";
            claims = BuildApiKeyClaims(
                userName,
                ArchLucidRoles.Admin,
                [
                    new Claim("permission", "commit:run"),
                    new Claim("permission", "seed:results"),
                    new Claim("permission", "export:consulting-docx"),
                    new Claim("permission", "metrics:read"),
                    new Claim("permission", "replay:comparisons"),
                    new Claim("permission", "replay:diagnostics")
                ],
                keys);
        }
        else if (MatchesAnyCommaSeparatedKey(key, readerKeyRaw))
        {
            if (IsKeyExpired(keys.ReadOnlyKeyExpiresAt))
                return Task.FromResult(AuthenticateResult.Fail(
                    "The read-only API key has expired. Rotate the key and update Authentication:ApiKey:ReadOnlyKey."));

            userName = "ApiKeyReadOnly";
            claims = BuildApiKeyClaims(
                userName,
                ArchLucidRoles.Reader,
                [new Claim("permission", "metrics:read")],
                keys);
        }
        else
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key."));

        ClaimsIdentity successIdentity = new(claims, Scheme.Name);
        ClaimsPrincipal successPrincipal = new(successIdentity);
        AuthenticationTicket successTicket = new(successPrincipal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(successTicket));
    }

    /// <summary>
    ///     When <paramref name="raw" /> contains commas, each segment (trimmed) is an acceptable key material
    ///     (zero-downtime rotation: old and new keys during cutover). Empty segments are ignored.
    /// </summary>
    private static bool MatchesAnyCommaSeparatedKey(string provided, string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        ReadOnlySpan<char> span = raw.AsSpan();
        int start = 0;

        for (int i = 0; i <= span.Length; i++)

            if (i == span.Length || span[i] == ',')
            {
                ReadOnlySpan<char> segment = span.Slice(start, i - start).Trim();

                if (!segment.IsEmpty)
                {
                    string expected = segment.ToString();

                    if (ConstantTimeKeyEquals(provided, expected))
                        return true;
                }

                start = i + 1;
            }

        return false;
    }

    /// <summary>
    ///     Compares UTF-8 key material using SHA-256 digests so length and timing do not leak raw key bytes.
    /// </summary>
    private static bool ConstantTimeKeyEquals(string provided, string expected)
    {
        if (string.IsNullOrEmpty(provided) || string.IsNullOrEmpty(expected))
            return false;

        ReadOnlySpan<byte> a = SHA256.HashData(Encoding.UTF8.GetBytes(provided));
        ReadOnlySpan<byte> b = SHA256.HashData(Encoding.UTF8.GetBytes(expected));

        return CryptographicOperations.FixedTimeEquals(a, b);
    }

    /// <summary>
    ///     Returns <c>true</c> when <paramref name="expiresAt" /> is set and is strictly in the past.
    /// </summary>
    private bool IsKeyExpired(DateTimeOffset? expiresAt)
        => expiresAt is not null && timeProvider.GetUtcNow() > expiresAt.Value;

    private static Claim[] BuildApiKeyClaims(
        string userName,
        string role,
        Claim[] permissionClaims,
        ApiKeyAuthenticationOptions keys)
    {
        List<Claim> claims =
        [
            new Claim(ClaimTypes.Name, userName),
            new Claim(ClaimTypes.Role, role),
            ..permissionClaims
        ];

        if (keys.TenantId is Guid tenantId && tenantId != Guid.Empty)
            claims.Add(new Claim("tenant_id", tenantId.ToString("D")));

        if (keys.WorkspaceId is Guid workspaceId && workspaceId != Guid.Empty)
            claims.Add(new Claim("workspace_id", workspaceId.ToString("D")));

        if (keys.ProjectId is Guid projectId && projectId != Guid.Empty)
            claims.Add(new Claim("project_id", projectId.ToString("D")));

        return claims.ToArray();
    }

    private static Claim[] BuildSyntheticAdminClaims() =>
        [
            new Claim(ClaimTypes.Name, "DevUser"),
            new Claim(ClaimTypes.Role, ArchLucidRoles.Admin),
            new Claim("permission", "commit:run"),
            new Claim("permission", "seed:results"),
            new Claim("permission", "export:consulting-docx"),
            new Claim("permission", "metrics:read"),
            new Claim("permission", "replay:comparisons"),
            new Claim("permission", "replay:diagnostics")
        ];
}
