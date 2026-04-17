using System.Text.RegularExpressions;

namespace ArchLucid.Api.Auth.Services;

internal static class ExternalIdIssuerPatterns
{
    private static readonly Regex CiamV2Issuer = new(
        @"^https://[a-z0-9-]+\.ciamlogin\.com/[^/]+/v2\.0/?$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    /// <summary>Entra External ID (CIAM) v2.0 issuer pattern.</summary>
    public static bool IsConsumerIdentityIssuer(string? issuer)
    {
        if (string.IsNullOrWhiteSpace(issuer))
            return false;

        return CiamV2Issuer.IsMatch(issuer.Trim());
    }
}
