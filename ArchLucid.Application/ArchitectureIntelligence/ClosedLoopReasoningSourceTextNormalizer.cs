using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopReasoningSourceTextNormalizer
{
    public static ClosedLoopReasoningSourceText Normalize(ClosedLoopReasoningSourceText source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ClosedLoopReasoningSourceText
        {
            FileName = source.FileName?.Trim() ?? string.Empty,
            ContentType = source.ContentType?.Trim() ?? string.Empty,
            Content = source.Content,
        };
    }
}
