using ArchLucid.Application.Notifications.Email;

namespace ArchLucid.Application.Pilots;

internal static class PilotExportLinkHonestyCopy
{
    internal const string ReviewLinkBaseNotStored = "Review link base was not stored.";
    internal const string OperatorLinkBaseNotStored = "Operator link base was not stored.";

    internal static bool TryNormalizeReviewLinkBase(string? raw, out string normalized)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            normalized = string.Empty;
            return false;
        }

        normalized = raw.Trim().TrimEnd('/');
        return true;
    }

    internal static bool TryNormalizeOperatorLinkBase(string? raw, out string normalized)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            normalized = string.Empty;
            return false;
        }

        string? authority = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority(raw);

        if (string.IsNullOrWhiteSpace(authority))
        {
            normalized = string.Empty;
            return false;
        }

        normalized = authority;
        return true;
    }

    internal static bool IsReviewLinkBaseStored(string? baseUrl) =>
        TryNormalizeReviewLinkBase(baseUrl, out _);

    internal static bool IsOperatorLinkBaseStored(string? baseUrl) =>
        TryNormalizeOperatorLinkBase(baseUrl, out _);
}
