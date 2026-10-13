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
                : NormalizeLineEndings(source.Content.Trim()),
        };
    }

    private static string NormalizeFileNameForHash(string? rawFileName)
    {
        string fileName = rawFileName?.Trim() ?? string.Empty;

        if (fileName.Length == 0)
            return fileName;

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

        return CollapseParentPathSegments(fileName);
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

    private static string NormalizeLineEndings(string content)
    {
        return content
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Replace('\u2028', '\n')
            .Replace('\u2029', '\n');
    }
}
