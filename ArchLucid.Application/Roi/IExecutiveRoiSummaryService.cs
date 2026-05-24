using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Builds the cross-run executive ROI summary for the current tenant scope.
/// </summary>
public interface IExecutiveRoiSummaryService
{
    Task<ExecutiveRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default);

    /// <summary>
    ///     Builds a cross-tenant portfolio summary for the calling user, aggregating metrics across
    ///     all tenants they have access to. Enforces k-anonymity (k >= 5).
    /// </summary>
    Task<CrossTenantPortfolioSummaryResponse> GetCrossTenantPortfolioSummaryAsync(string userDirectoryKey, CancellationToken cancellationToken = default);

    /// <summary>Monthly executive ROI snapshots for trend charts (last six months).</summary>
    Task<ExecutiveRoiHistoryResponse> BuildHistoryAsync(CancellationToken cancellationToken = default);

    /// <summary>Deduplicated finding rows and environment savings slices for CSV export and charts.</summary>
    Task<ExecutiveRoiExportResponse> BuildExportAsync(CancellationToken cancellationToken = default);
}
