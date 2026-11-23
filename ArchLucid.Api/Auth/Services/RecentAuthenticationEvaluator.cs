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
                if (!TryParseUnixInstant(claim.Value, out DateTimeOffset instant))
                    continue;

                if (latest is null || instant > latest)
                    latest = instant;
            }

            return latest;
        }

        List<Claim> iatClaims = principal.FindAll(JwtRegisteredClaimNames.Iat).ToList();

        if (iatClaims.Count == 0)
            return null;

        DateTimeOffset? latestIat = null;

        foreach (Claim claim in iatClaims)
        {
            if (!TryParseUnixInstant(claim.Value, out DateTimeOffset instant))
                continue;

            if (latestIat is null || instant > latestIat)
                latestIat = instant;
        }

        return latestIat;
    }

    // A syntactically valid Int64 can still be outside DateTimeOffset's supported UTC range.
    // Treat those claims as malformed rather than turning step-up validation into a 500.
    private static bool TryParseUnixInstant(string raw, out DateTimeOffset instant)
    {
        instant = default;

        if (!long.TryParse(raw, out long seconds)
            || seconds < DateTimeOffset.MinValue.ToUnixTimeSeconds()
            || seconds > DateTimeOffset.MaxValue.ToUnixTimeSeconds())
            return false;

        instant = DateTimeOffset.FromUnixTimeSeconds(seconds);
        return true;
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
