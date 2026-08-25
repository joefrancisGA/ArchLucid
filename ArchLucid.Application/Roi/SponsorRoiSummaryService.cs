using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <inheritdoc cref="ISponsorRoiSummaryService"/>
public sealed class SponsorRoiSummaryService(
    SponsorRoiSummaryBuilder summaryBuilder,
    SponsorRoiHistoryBuilder historyBuilder,
    SponsorRoiExportBuilder exportBuilder,
    CrossTenantPortfolioSummaryBuilder portfolioBuilder) : ISponsorRoiSummaryService
{
    /// <summary>Max distinct systems whose run details are loaded per request (defense against huge tenants).</summary>
    public const int DefaultSystemDetailCap = SponsorRoiRunCollector.DefaultSystemDetailCap;

    private readonly SponsorRoiSummaryBuilder _summaryBuilder =
        summaryBuilder ?? throw new ArgumentNullException(nameof(summaryBuilder));

    private readonly SponsorRoiHistoryBuilder _historyBuilder =
        historyBuilder ?? throw new ArgumentNullException(nameof(historyBuilder));

    private readonly SponsorRoiExportBuilder _exportBuilder =
        exportBuilder ?? throw new ArgumentNullException(nameof(exportBuilder));

    private readonly CrossTenantPortfolioSummaryBuilder _portfolioBuilder =
        portfolioBuilder ?? throw new ArgumentNullException(nameof(portfolioBuilder));

    /// <inheritdoc/>
    public Task<SponsorRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default) =>
        _summaryBuilder.BuildAsync(cancellationToken);

    public Task<CrossTenantPortfolioSummaryResponse> GetCrossTenantPortfolioSummaryAsync(
        string userDirectoryKey,
        CancellationToken cancellationToken = default) =>
        _portfolioBuilder.GetCrossTenantPortfolioSummaryAsync(userDirectoryKey, cancellationToken);

    /// <inheritdoc />
    public Task<SponsorRoiHistoryResponse> BuildHistoryAsync(CancellationToken cancellationToken = default) =>
        _historyBuilder.BuildHistoryAsync(cancellationToken);

    /// <inheritdoc />
    public Task<SponsorRoiExportResponse> BuildExportAsync(CancellationToken cancellationToken = default) =>
        _exportBuilder.BuildExportAsync(cancellationToken);

    /// <summary>
    ///     Authoritative portfolio headline: open + needs-evidence estimated USD (V1 §2.8).
    ///     Shared by single-tenant summary, board pack, and cross-tenant portfolio rollup.
    /// </summary>
    internal static decimal ComputeHeadlineSavingsFromBasis(SponsorRoiBasisBreakdown basis) =>
        SponsorRoiRunCollector.ComputeHeadlineSavingsFromBasis(basis);
}
