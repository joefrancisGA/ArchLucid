using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Validates that the caller recently authenticated (step-up) before sensitive identity mutations.</summary>
public static class RecentAuthenticationEvaluator
{
    public const int DefaultMaxAgeMinutes = 15;

    public static DateTimeOffset? TryGetAuthenticationInstant(ClaimsPrincipal principal)
    {
        ArgumentNullException.ThrowIfNull(principal);

        string? authTime = principal.FindFirst("auth_time")?.Value;

        if (authTime is not null)
        {
            if (long.TryParse(authTime, out long authTimeSeconds))
            {
                return DateTimeOffset.FromUnixTimeSeconds(authTimeSeconds);
            }

            return null;
        }

        string? iat = principal.FindFirst(JwtRegisteredClaimNames.Iat)?.Value;

        if (long.TryParse(iat, out long iatSeconds))
        {
            return DateTimeOffset.FromUnixTimeSeconds(iatSeconds);
        }

        return null;
    }

    public static bool HasRecentAuthentication(
        ClaimsPrincipal principal,
        TimeProvider timeProvider,
        int maxAgeMinutes = DefaultMaxAgeMinutes)
    {
        DateTimeOffset? authenticatedAt = TryGetAuthenticationInstant(principal);

        if (authenticatedAt is null)
        {
            return false;
        }

        TimeSpan maxAge = TimeSpan.FromMinutes(Math.Clamp(maxAgeMinutes, 1, 60));
        TimeSpan age = timeProvider.GetUtcNow() - authenticatedAt.Value;

        if (age < TimeSpan.Zero)
            return false;

        return age <= maxAge;
    }
}
