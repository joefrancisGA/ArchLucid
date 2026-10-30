namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class DifficultyBasedExtractionRouter
{
    private static bool IsValidMarkerStartBoundary(char previous) =>
        !ContinuesLexicalTokenBefore(previous);

    private static bool IsValidMarkerEndBoundary(char next) =>
        !ContinuesLexicalTokenAfter(next);

    private static bool IsValidOwnershipMarkerStartBoundary(char previous) =>
        IsValidMarkerStartBoundary(previous) && !IsLabelOrCodeSpanOpeningDelimiter(previous);

    private static bool IsValidOwnershipMarkerEndBoundary(char next) =>
        IsValidMarkerEndBoundary(next) && !IsLabelOrCodeSpanClosingDelimiter(next);

    /// <summary>
    ///     Character before the match still belongs to the same hostname/path/query token (e.g. <c>api.owner</c>).
    /// </summary>
    private static bool ContinuesLexicalTokenBefore(char c) =>
        char.IsLetterOrDigit(c)
        || c is '-' or '_' or '.' or '/' or ':' or '@' or '?' or '&' or '#' or '=' or '%' or '+';

    /// <summary>
    ///     Character after the match still belongs to the same token; excludes <c>.</c> so sentence terminators end prose words.
    /// </summary>
    private static bool ContinuesLexicalTokenAfter(char c) =>
        char.IsLetterOrDigit(c)
        || c is '-' or '_' or '/' or '@' or '?' or '&' or '#' or '=' or '%' or '+';

    /// <summary>
    ///     Opening delimiters for parenthetical labels, bracket notes, markdown emphasis/code spans, and quoted strings.
    /// </summary>
    private static bool IsLabelOrCodeSpanOpeningDelimiter(char c) =>
        c is '(' or '[' or '{' or '<' or '`' or '*' or '~' or '"' or '\'' or '“' or '‘' or '\uFF1A' or '\uFF08';

    private static bool IsLabelOrCodeSpanClosingDelimiter(char c) =>
        c is ')' or ']' or '}' or '>' or '`' or '*' or '~' or '"' or '\'' or '”' or '’' or '\uFF1A' or '\uFF09';

    private static int FindBoundedOwnershipMarkerIndex(string sourceText, string marker, int startIndex)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(marker);

        ReadOnlySpan<char> text = sourceText.AsSpan();
        ReadOnlySpan<char> needle = marker.AsSpan();

        if (startIndex < 0 || startIndex > text.Length || needle.Length > text.Length - startIndex)
        {
            return -1;
        }

        for (int index = startIndex; index <= text.Length - needle.Length; index++)
        {
            if (!text.Slice(index, needle.Length).Equals(needle, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            bool startOk = index == 0 || IsValidOwnershipMarkerStartBoundary(text[index - 1]);
            int end = index + needle.Length;
            bool endOk = end >= text.Length || IsValidOwnershipMarkerEndBoundary(text[end]);

            if (startOk && endOk)
            {
                return index;
            }
        }

        return -1;
    }

    private static bool ContainsOwnershipMarker(string sourceText, string marker)
    {
        if (FindBoundedOwnershipMarkerIndex(sourceText, marker, 0) >= 0)
        {
            return true;
        }

        if (!marker.Contains(' ')
            && !marker.Contains('-')
            && !marker.EndsWith("s", StringComparison.OrdinalIgnoreCase)
            && FindBoundedOwnershipMarkerIndex(sourceText, marker + "s", 0) >= 0)
        {
            return true;
        }

        return false;
    }
}
