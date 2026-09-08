using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Retrieval;

/// <summary>
///     Supplies bounded graph community summaries for the Premium insight generator when
///     <c>Retrieval:Advanced:EnableCommunitySummarization</c> is true (DX-17).
/// </summary>
public interface IGraphCommunitySummaryLookup
{
    Task<IReadOnlyList<InsightGeneratorCommunitySummary>> GetSummariesAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken cancellationToken);
}
