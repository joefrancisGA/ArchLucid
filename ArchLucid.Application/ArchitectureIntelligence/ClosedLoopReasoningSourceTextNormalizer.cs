using System.Text;
using ArchLucid.ContextIngestion;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Graph;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopReasoningSourceTextNormalizer
{
    public static ClosedLoopReasoningSourceText Normalize(ClosedLoopReasoningSourceText source)
    {
        ArgumentNullException.ThrowIfNull(source);

        string contentType = NormalizeUnicodeSpaces(
            SupportedContextDocumentContentTypes.NormalizeContentTypeForLookup(source.ContentType));

        if (contentType.Length > 0)
            contentType = CollapseInteriorAsciiSpaces(contentType).ToLowerInvariant();

        string fileName = NormalizeFileNameForHash(source.FileName);

        return new ClosedLoopReasoningSourceText
        {
            FileName = fileName,
            ContentType = contentType,
            // Normalize platform line endings so equivalent uploaded documents share a cache key.
            Content = string.IsNullOrWhiteSpace(source.Content)
                ? string.Empty
                : StripInvisibleFormatCharacters(
                    CollapseInteriorAsciiSpaces(
                        NormalizeUnicodeSpaces(StripUtf8Bom(NormalizeLineEndings(source.Content.Trim()))))),
        };
    }

    private static string NormalizeFileNameForHash(string? rawFileName)
    {
        string fileName = rawFileName?.Trim() ?? string.Empty;

        if (fileName.Length == 0)
            return fileName;

        fileName = GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(fileName);

        if (fileName.Length == 0)
            return fileName;

        string normalized = CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(fileName)).Normalize(NormalizationForm.FormC);

        return normalized.ToLowerInvariant();
    }

    private static ReadOnlySpan<char> UnicodeLineBreakScalars =>
    [
        '\0',
        '\u000b',
        '\u000c',
        '\r',
        '\u001c',
        '\u001d',
        '\u001e',
        '\u001f',
        '\u0084',
        '\u0085',
        '\u007f',
        '\u200b',
        '\u2028',
        '\u2029',
    ];

    private static string NormalizeLineEndings(string content)
    {
        content = content.Replace("\r\n", "\n");

        foreach (char lineBreak in UnicodeLineBreakScalars)
            content = content.Replace(lineBreak, '\n');

        for (int c1Control = 0x80; c1Control <= 0x9F; c1Control++)
            content = content.Replace((char)c1Control, '\n');

        for (int c0Control = 0x01; c0Control <= 0x1F; c0Control++)
            content = content.Replace((char)c0Control, '\n');

        return content;
    }

    private static string StripUtf8Bom(string content)
    {
        if (content.Length == 0)
            return content;

        if (content[0] == '\uFEFF')
            return content[1..];

        return content;
    }

    private static string CollapseInteriorAsciiSpaces(string content)
    {
        if (content.Length == 0)
            return content;

        while (content.Contains("  ", StringComparison.Ordinal))
            content = content.Replace("  ", " ", StringComparison.Ordinal);

        return content;
    }

    private static string NormalizeUnicodeSpaces(string content)
    {
        if (content.Length == 0)
            return content;

        return content
            .Replace('\u00a0', ' ')
            .Replace('\u202f', ' ');
    }

    private static string StripInvisibleFormatCharacters(string content)
    {
        if (content.Length == 0)
            return content;

        return content
            .Replace("\u200c", string.Empty, StringComparison.Ordinal)
            .Replace("\u200d", string.Empty, StringComparison.Ordinal)
            .Replace("\ufeff", string.Empty, StringComparison.Ordinal);
    }

}
