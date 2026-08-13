namespace ArchLucid.Contracts.Roi;

/// <summary>Flat finding row for sponsor ROI CSV export.</summary>
public sealed class SponsorRoiExportRow
{
    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public string SystemName
    {
        get;
        init;
    } = string.Empty;

    public string Environment
    {
        get;
        init;
    } = string.Empty;

    public string Category
    {
        get;
        init;
    } = string.Empty;

    public string Severity
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string? AffectedResource
    {
        get;
        init;
    }

    public decimal? EstimatedUsdSavings
    {
        get;
        init;
    }
}

/// <summary>Deduplicated finding rows for CSV export.</summary>
public sealed class SponsorRoiExportResponse
{
    public IReadOnlyList<SponsorRoiExportRow> Rows
    {
        get;
        init;
    } = [];

    /// <summary>Aggregated savings by environment tag for dashboard pie charts.</summary>
    public IReadOnlyList<SponsorRoiEnvironmentSavingsSlice> SavingsByEnvironment
    {
        get;
        init;
    } = [];

    /// <summary>Enterprise Agreement discount multiplier applied to cost-category savings (1.0 = Retail list).</summary>
    public decimal EaDiscountMultiplier
    {
        get;
        init;
    } = 1.0m;

    /// <summary><see cref="SponsorRoiSavingsPricingBasis.Retail" /> or <see cref="SponsorRoiSavingsPricingBasis.EaAdjusted" />.</summary>
    public string SavingsPricingBasis
    {
        get;
        init;
    } = SponsorRoiSavingsPricingBasis.Retail;

    public string? SavingsPricingBasisDescription
    {
        get;
        init;
    }

    public string CostEvidenceFreshnessStatus
    {
        get;
        init;
    } = RoiCostEvidenceFreshness.Missing;

    public DateTime? LatestCostEvidenceCollectionTimestampUtc
    {
        get;
        init;
    }

    public int CostEvidenceStaleAfterDays
    {
        get;
        init;
    } = 90;
}

/// <summary>One environment slice for savings pie charts.</summary>
public sealed class SponsorRoiEnvironmentSavingsSlice
{
    public string Environment
    {
        get;
        init;
    } = string.Empty;

    public decimal EstimatedUsdSavings
    {
        get;
        init;
    }
}
