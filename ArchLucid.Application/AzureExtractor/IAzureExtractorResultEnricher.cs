using ArchLucid.Contracts.AzureExtractor;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>
///     Fills missing ARM inventory fields (type, location, tier) using naming conventions and optional LLM inference.
/// </summary>
public interface IAzureExtractorResultEnricher
{
    Task<IReadOnlyList<EnrichedAzureExtractorInventoryLine>> EnrichAsync(
        IReadOnlyList<AzureExtractorInventoryResourceLine> lines,
        CancellationToken cancellationToken = default);
}
