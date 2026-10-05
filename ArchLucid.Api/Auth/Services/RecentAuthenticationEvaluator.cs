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

        List<Claim> authTimeClaims = principal.FindAll("auth_time").ToList();

        if (authTimeClaims.Count > 0)
        {
            DateTimeOffset? latest = null;

            foreach (Claim claim in authTimeClaims)
            {
                if (!long.TryParse(claim.Value, out long authTimeSeconds))
                    continue;

                DateTimeOffset instant = DateTimeOffset.FromUnixTimeSeconds(authTimeSeconds);

                if (latest is null || instant > latest)
                    latest = instant;
            }

            return latest;
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
