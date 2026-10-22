namespace ArchLucid.Notifications;

/// <summary>Escapes user-controlled literals embedded in Slack incoming-webhook mrkdwn emphasis.</summary>
public static class ChatOpsSlackMrkdwnEscaper
{
    public static string EscapeFormattingMetacharacters(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        return EscapeCore(value, escapeBackticks: true);
    }

    /// <summary>Escapes emphasis metacharacters while preserving intentional <c>`code`</c> spans in supporting lines.</summary>
    public static string EscapeSupportingParagraphMetacharacters(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        return EscapeCore(value, escapeBackticks: false);
    }

    private static string EscapeCore(string value, bool escapeBackticks)
    {
        string escaped = value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("&", "&amp;", StringComparison.Ordinal)
            .Replace("<", "&lt;", StringComparison.Ordinal)
            .Replace(">", "&gt;", StringComparison.Ordinal)
            .Replace("*", "\\*", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal)
            .Replace("~", "\\~", StringComparison.Ordinal);

        if (!escapeBackticks)
        {
            return escaped;
        }

        return escaped.Replace("`", "\\`", StringComparison.Ordinal);
    }
}
