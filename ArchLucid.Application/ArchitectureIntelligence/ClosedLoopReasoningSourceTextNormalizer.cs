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

        string fileName = source.FileName?.Trim() ?? string.Empty;

        if (fileName.Length > 0)
            fileName = fileName.Replace('\\', '/');

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

    private static string NormalizeLineEndings(string content)
    {
        return content.Replace("\r\n", "\n").Replace('\r', '\n');
    }
}
