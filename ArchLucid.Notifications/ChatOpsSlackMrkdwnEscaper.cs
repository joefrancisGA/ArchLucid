namespace ArchLucid.Notifications;

/// <summary>Escapes user-controlled literals embedded in Slack incoming-webhook mrkdwn emphasis.</summary>
public static class ChatOpsSlackMrkdwnEscaper
{
    public static string EscapeFormattingMetacharacters(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        return value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("&", "&amp;", StringComparison.Ordinal)
            .Replace("<", "&lt;", StringComparison.Ordinal)
            .Replace(">", "&gt;", StringComparison.Ordinal)
            .Replace("*", "\\*", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal)
            .Replace("~", "\\~", StringComparison.Ordinal)
            .Replace("`", "\\`", StringComparison.Ordinal);
    }
}
