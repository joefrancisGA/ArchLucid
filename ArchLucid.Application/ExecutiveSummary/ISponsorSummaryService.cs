using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.SponsorSummary;

/// <summary>
///     Aggregates raw architectural findings into high-level sponsor scores.
/// </summary>
public interface ISponsorSummaryService
{
    /// <summary>
    ///     Generates an sponsor report for the specified tenant based on their latest architecture run.
    /// </summary>
    Task<SponsorReportResponse> GenerateSummaryAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
