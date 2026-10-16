namespace ArchLucid.Application.Notifications.Email;

/// <summary>Sanitizes untrusted fragments embedded in SMTP subject lines.</summary>
public static class EmailHeaderFragmentSanitizer
{
    public static string Sanitize(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        string trimmed = value.Trim();

        if (trimmed.Length == 0)
            return trimmed;

        return trimmed
            .Replace("\r\n", " ", StringComparison.Ordinal)
            .Replace('\r', ' ')
            .Replace('\n', ' ')
            .Replace('\u0085', ' ')
            .Replace('\u2028', ' ')
            .Replace('\u2029', ' ');
    }
}
