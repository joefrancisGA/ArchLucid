namespace ArchLucid.Application.Notifications.Email;

/// <summary>Anonymous operator-shell deep links for weekly digest sponsor CTAs (TB-2196).</summary>
public static class ExecDigestSponsorDeepLinkOperatorLinks
{
    public static string BuildDashboardUrl(string? operatorBaseUrl, string token)
    {
        string relativePath = $"/digest/sponsor?token={Uri.EscapeDataString(token)}";

        string? authority = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority(operatorBaseUrl);

        if (authority is null)
            return relativePath;

        return $"{authority}{relativePath}";
    }

    public static string BuildRunCollateralUrl(string? operatorBaseUrl, string runIdHex, string token)
    {
        string normalizedRunIdHex = runIdHex.Trim().Replace("-", string.Empty, StringComparison.Ordinal);
        string relativePath =
            $"/digest/sponsor/run/{Uri.EscapeDataString(normalizedRunIdHex)}?token={Uri.EscapeDataString(token)}";

        string? authority = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority(operatorBaseUrl);

        if (authority is null)
            return relativePath;

        return $"{authority}{relativePath}";
    }
}
