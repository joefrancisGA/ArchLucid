using ArchLucid.Core.Notifications;

namespace ArchLucid.Notifications;

/// <summary>Sanitizes untrusted user-authored lines before chat-ops webhook assembly.</summary>
internal static class ChatOpsWebhookUserFragments
{
    public static string SanitizeUserLine(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        return EmailHeaderFragmentSanitizer.Sanitize(value);
    }
}