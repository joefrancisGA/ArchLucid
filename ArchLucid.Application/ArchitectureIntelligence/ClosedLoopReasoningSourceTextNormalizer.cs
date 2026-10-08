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
            Content = string.IsNullOrWhiteSpace(source.Content)
                ? string.Empty
                : source.Content.Trim(),
        };
    }
}
