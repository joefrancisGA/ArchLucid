using System.Security.Claims;

using ArchLucid.Application.Common;

namespace ArchLucid.Host.Core.Auth.Services;

/// <summary>
///     HTTP-scoped actor resolution from <see cref="HttpContext.User"/> (display name + JWT object id for SoD).
/// </summary>
/// <remarks>Implements <see cref="IActorContext"/> at the host boundary; Application consumes the interface only.</remarks>
public sealed class HttpActorContext(IHttpContextAccessor httpContextAccessor) : IActorContext
{
    private readonly IHttpContextAccessor _httpContextAccessor =
        httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

    private const string FallbackActor = "api-user";
    private const string TidClaimType = "tid";
    private const string OidShortClaimType = "oid";
    private const string OidLongClaimType = "http://schemas.microsoft.com/identity/claims/objectidentifier";

    /// <inheritdoc/>
    public string GetActor()
    {
        HttpContext? httpContext = _httpContextAccessor.HttpContext;
        ClaimsPrincipal? user = httpContext?.User;
        string? name = user?.Identity?.Name;

        if (!string.IsNullOrWhiteSpace(name))
            return name.Trim();

        // JwtBearer with MapInboundClaims=false (local PEM CI tokens) emits short claim type "name", not ClaimTypes.Name.
        string? jwtName = user?.FindFirst("name")?.Value;

        return !string.IsNullOrWhiteSpace(jwtName) ? jwtName.Trim() : FallbackActor;
    }

    /// <inheritdoc/>
    public string GetActorId()
    {
        HttpContext? httpContext = _httpContextAccessor.HttpContext;
        ClaimsPrincipal? user = httpContext?.User;
        string? oid = TryGetClaimValue(user, OidShortClaimType) ?? TryGetClaimValue(user, OidLongClaimType);

        if (string.IsNullOrWhiteSpace(oid))
            return GetActor();

        string oidNormalized = oid.Trim();
        string? tid = TryGetClaimValue(user, TidClaimType);

        return string.IsNullOrWhiteSpace(tid)
            ? $"{ActorContextKeys.JwtActorKeyPrefix}{oidNormalized}"
            : $"{ActorContextKeys.JwtActorKeyPrefix}{tid.Trim()}:{oidNormalized}";
    }

    private static string? TryGetClaimValue(ClaimsPrincipal? user, string claimType)
    {
        Claim? first = user?.FindFirst(claimType);

        return string.IsNullOrWhiteSpace(first?.Value) ? null : first.Value;
    }
}
