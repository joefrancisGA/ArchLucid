using ArchLucid.Core.Notifications;

namespace ArchLucid.Notifications.Advisory;

/// <summary>Normalizes advisory digest summary text before chat-ops webhook assembly.</summary>
internal static class ChatOpsDigestSummaryFragments
{
    public static string SanitizeForDelivery(string summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return EmailHeaderFragmentSanitizer.Sanitize(summary);
    }
}