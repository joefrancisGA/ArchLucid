namespace ArchLucid.Core.Security;

/// <summary>Detects embedded or percent-encoded line breaks in HTTPS webhook destination strings.</summary>
public static class WebhookHttpsUriLineBreakGuard
{
    public static bool ContainsForbiddenLineBreakMaterial(string value)
    {
        if (ContainsEmbeddedLineBreaks(value))
        {
            return true;
        }

        return ContainsPercentEncodedLineBreaks(value);
    }

    private static bool ContainsEmbeddedLineBreaks(string value)
    {

        foreach (char character in value)
        {

            if (character is '\r' or '\n' or '\u0085' or '\u2028' or '\u2029')
            {
                return true;
            }
        }

        return false;
    }

    private static bool ContainsPercentEncodedLineBreaks(string value)
    {
        return value.Contains("%0D", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%0A", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%E2%80%A8", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%E2%80%A9", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%C2%85", StringComparison.OrdinalIgnoreCase);
    }
}
