namespace ArchLucid.Application.Notifications.Email;

/// <summary>Normalizes SMTP-style CRLF in multipart plain-text body fragments while preserving intentional Unix line feeds.</summary>
public static class EmailMultipartPlainTextLineBreakNormalizer
{
    public static string? NormalizeOptional(string? value)
    {
        if (value is null)
            return null;

        return value
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace('\r', '\n')
            .Replace('\f', '\n')
            .Replace('\u000B', '\n')
            .Replace('\u0085', '\n')
            .Replace('\u2028', '\n')
            .Replace('\u2029', '\n');
    }
}
