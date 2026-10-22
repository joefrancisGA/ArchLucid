using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.SponsorReport;

/// <summary>
///     Aggregates raw architectural findings into high-level sponsor scores.
/// </summary>
public interface ISponsorReportService
{
    /// <summary>
    ///     Generates an Sponsor report for the specified tenant based on their latest architecture run.
    /// </summary>
    Task<SponsorReportResponse> GenerateSummaryAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
