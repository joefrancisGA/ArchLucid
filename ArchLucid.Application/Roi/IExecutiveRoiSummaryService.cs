using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Builds the cross-run sponsor ROI summary for the current tenant scope.
/// </summary>
public interface ISponsorRoiSummaryService
{
    Task<SponsorRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default);

    /// <summary>
    ///     Builds a cross-tenant portfolio summary for the calling user, aggregating metrics across
    ///     all tenants they have access to. Enforces k-anonymity (k >= 5).
    /// </summary>
    Task<CrossTenantPortfolioSummaryResponse> GetCrossTenantPortfolioSummaryAsync(string userDirectoryKey, CancellationToken cancellationToken = default);

    /// <summary>Monthly sponsor ROI snapshots for trend charts (last six months).</summary>
    Task<SponsorRoiHistoryResponse> BuildHistoryAsync(CancellationToken cancellationToken = default);

    /// <summary>Deduplicated finding rows and environment savings slices for CSV export and charts.</summary>
    Task<SponsorRoiExportResponse> BuildExportAsync(CancellationToken cancellationToken = default);
}
