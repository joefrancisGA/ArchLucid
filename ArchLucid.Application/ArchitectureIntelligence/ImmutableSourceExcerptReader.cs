namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ImmutableSourceExcerptReader
{
    public static string? Trim(string? contentText, int maxChars)
    {
        if (string.IsNullOrWhiteSpace(contentText))
        {
            return null;
        }

        if (maxChars <= 0)
        {
            return string.Empty;
        }

        string trimmed = contentText.Trim();

        if (trimmed.Length <= maxChars)
        {
            return trimmed;
        }

        return trimmed[..maxChars];
    }
}
