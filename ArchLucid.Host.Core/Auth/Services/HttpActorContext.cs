using System.Net.Mail;
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
    private const string EmailShortClaimType = "email";
    private const string PreferredUsernameClaimType = "preferred_username";
    private const string UpnClaimType = "upn";

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
    public string? TryGetSubmitterMailbox()
    {
        HttpContext? httpContext = _httpContextAccessor.HttpContext;
        ClaimsPrincipal? user = httpContext?.User;

        string? fromEmailClaim = TryGetClaimValue(user, EmailShortClaimType)
            ?? TryGetClaimValue(user, ClaimTypes.Email);

        if (TryNormalizeMailbox(fromEmailClaim, out string? normalizedEmail))
        {
            return normalizedEmail;
        }

        string? fromPreferredUsername = TryGetClaimValue(user, PreferredUsernameClaimType);

        if (TryNormalizeMailbox(fromPreferredUsername, out string? normalizedPreferred))
        {
            return normalizedPreferred;
        }

        string? fromUpn = TryGetClaimValue(user, UpnClaimType);

        if (TryNormalizeMailbox(fromUpn, out string? normalizedUpn))
        {
            return normalizedUpn;
        }

        if (TryNormalizeMailbox(GetActor(), out string? normalizedActor))
        {
            return normalizedActor;
        }

        return null;
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

    private static bool TryNormalizeMailbox(string? candidate, out string? mailbox)
    {
        mailbox = null;

        if (string.IsNullOrWhiteSpace(candidate))
        {
            return false;
        }

        string trimmed = candidate.Trim();

        if (!trimmed.Contains('@', StringComparison.Ordinal))
        {
            return false;
        }

        try
        {
            MailAddress parsed = new(trimmed);
            mailbox = parsed.Address;

            return !string.IsNullOrWhiteSpace(mailbox);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
