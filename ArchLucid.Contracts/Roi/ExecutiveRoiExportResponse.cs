namespace ArchLucid.Contracts.Roi;

/// <summary>Flat finding row for executive ROI CSV export.</summary>
public sealed class ExecutiveRoiExportRow
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
public sealed class ExecutiveRoiExportResponse
{
    public IReadOnlyList<ExecutiveRoiExportRow> Rows
    {
        get;
        init;
    } = [];

    /// <summary>Aggregated savings by environment tag for dashboard pie charts.</summary>
    public IReadOnlyList<ExecutiveRoiEnvironmentSavingsSlice> SavingsByEnvironment
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

    /// <summary><see cref="ExecutiveRoiSavingsPricingBasis.Retail" /> or <see cref="ExecutiveRoiSavingsPricingBasis.EaAdjusted" />.</summary>
    public string SavingsPricingBasis
    {
        get;
        init;
    } = ExecutiveRoiSavingsPricingBasis.Retail;
}

/// <summary>One environment slice for savings pie charts.</summary>
public sealed class ExecutiveRoiEnvironmentSavingsSlice
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
