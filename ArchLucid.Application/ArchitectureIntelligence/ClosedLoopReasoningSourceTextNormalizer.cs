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

        return new ClosedLoopReasoningSourceText
        {
            FileName = source.FileName?.Trim() ?? string.Empty,
            ContentType = contentType,
            Content = string.IsNullOrWhiteSpace(source.Content)
                ? string.Empty
                : source.Content.Trim(),
        };
    }
}
