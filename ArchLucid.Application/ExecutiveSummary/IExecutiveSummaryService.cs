using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.ExecutiveSummary;

/// <summary>
///     Aggregates raw architectural findings into high-level executive scores.
/// </summary>
public interface IExecutiveSummaryService
{
    /// <summary>
    ///     Generates an executive summary for the specified tenant based on their latest architecture run.
    /// </summary>
    Task<ExecutiveSummaryResponse> GenerateSummaryAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
