using System.Text;
using ArchLucid.ContextIngestion;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopReasoningSourceTextNormalizer
{
    public static ClosedLoopReasoningSourceText Normalize(ClosedLoopReasoningSourceText source)
    {
        ArgumentNullException.ThrowIfNull(source);

        string contentType = SupportedContextDocumentContentTypes.NormalizeContentTypeForLookup(source.ContentType);

        if (contentType.Length > 0)
            contentType = contentType.ToLowerInvariant();

        string fileName = NormalizeFileNameForHash(source.FileName);

        return new ClosedLoopReasoningSourceText
        {
            FileName = fileName,
            ContentType = contentType,
            // Normalize platform line endings so equivalent uploaded documents share a cache key.
            Content = string.IsNullOrWhiteSpace(source.Content)
                ? string.Empty
                : StripInvisibleFormatCharacters(
                    NormalizeUnicodeSpaces(StripUtf8Bom(NormalizeLineEndings(source.Content.Trim())))),
        };
    }

    private static string NormalizeFileNameForHash(string? rawFileName)
    {
        string fileName = rawFileName?.Trim() ?? string.Empty;

        if (fileName.Length == 0)
            return fileName;

        fileName = DecodePercentEncodedFileNameTokens(fileName);
        fileName = fileName.Replace('\\', '/');

        while (fileName.StartsWith("./", StringComparison.Ordinal))
            fileName = fileName[2..];

        while (fileName.Contains("//", StringComparison.Ordinal))
            fileName = fileName.Replace("//", "/", StringComparison.Ordinal);

        while (fileName.Contains("/./", StringComparison.Ordinal))
            fileName = fileName.Replace("/./", "/", StringComparison.Ordinal);

        while (fileName.StartsWith('/'))
            fileName = fileName[1..];

        while (fileName.EndsWith('/') && fileName.Length > 1)
            fileName = fileName[..^1];

        string collapsed = CollapseParentPathSegments(fileName);

        if (collapsed.Length == 0)
            return collapsed;

        return NormalizeUnicodeSpaces(collapsed).Normalize(NormalizationForm.FormC);
    }

    private static string CollapseParentPathSegments(string fileName)
    {
        if (fileName.Length == 0)
            return fileName;

        string[] rawSegments = fileName.Split('/');
        List<string> segments = [];

        foreach (string segment in rawSegments)
        {

            if (segment.Length == 0 || string.Equals(segment, ".", StringComparison.Ordinal))
                continue;

            if (string.Equals(segment, "..", StringComparison.Ordinal))
            {

                if (segments.Count > 0)
                    segments.RemoveAt(segments.Count - 1);

                continue;
            }

            segments.Add(segment);
        }

        if (segments.Count == 0)
            return string.Empty;

        return string.Join('/', segments);
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

    private static string DecodePercentEncodedFileNameTokens(string fileName)
    {
        string decoded = fileName;

        while (decoded.Contains('%', StringComparison.Ordinal))
        {
            string next = Uri.UnescapeDataString(decoded);

            if (string.Equals(next, decoded, StringComparison.Ordinal))
                break;

            decoded = next;
        }

        return decoded;
    }
}
