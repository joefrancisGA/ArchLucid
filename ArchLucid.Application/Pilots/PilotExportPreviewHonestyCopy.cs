namespace ArchLucid.Application.Pilots;

/// <summary>Preview-cap and shortened-label copy shared across sponsor and first-value exports.</summary>
internal static class PilotExportPreviewHonestyCopy
{
    internal const int DefaultShortTitleMaxChars = 96;
    internal const string ShortenedTitleSuffix = " (shortened)";

    internal static string FormatShortenedPreview(string? value, string notStoredLabel, int maxChars = DefaultShortTitleMaxChars)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return notStoredLabel;
        }

        string trimmed = value.Trim();

        if (trimmed.Length <= maxChars)
        {
            return trimmed;
        }

        int prefixLength = maxChars - ShortenedTitleSuffix.Length;

        if (prefixLength < 1)
        {
            prefixLength = 1;
        }

        return string.Concat(trimmed.AsSpan(0, prefixLength), ShortenedTitleSuffix);
    }

    internal static string FormatCappedListIntro(int shownCount, int totalCount, string nounPhrase)
    {
        if (totalCount <= shownCount)
        {
            return $"{shownCount} {nounPhrase}";
        }

        return $"{shownCount} of {totalCount} {nounPhrase}";
    }

    internal static string FormatOmittedAfterPreview(int omittedCount, string remainderLine)
    {
        return omittedCount <= 0
            ? string.Empty
            : $"{omittedCount} {remainderLine}";
    }
}
