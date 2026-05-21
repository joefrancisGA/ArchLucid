namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Cross-run executive ROI rollup for the operator dashboard — latest committed run per system,
///     summed savings, and top recurring finding themes.
/// </summary>
public sealed class ExecutiveRoiSummaryResponse
{
    /// <summary>Sum of <see cref="SystemLatestRunRoi.EstimatedUsdSavings" /> across latest runs (null savings treated as zero).</summary>
    public decimal TotalEstimatedUsdSavings
    {
        get;
        set;
    }

    /// <summary>Distinct systems represented in <see cref="Systems" />.</summary>
    public int SystemCount
    {
        get;
        set;
    }

    /// <summary>Latest committed runs included in the aggregation (same as <see cref="Systems" />.Count).</summary>
    public int LatestRunCount
    {
        get;
        set;
    }

    public List<SystemLatestRunRoi> Systems
    {
        get;
        set;
    } = [];

    /// <summary>Top five (category, severity) finding groups across the latest runs.</summary>
    public List<SystemicIssueSummary> TopSystemicIssues
    {
        get;
        set;
    } = [];
}

/// <summary>ROI snapshot for the newest committed run of a single system.</summary>
public sealed class SystemLatestRunRoi
{
    public string SystemName
    {
        get;
        set;
    } = string.Empty;

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public DateTime? CommittedUtc
    {
        get;
        set;
    }

    public decimal? EstimatedUsdSavings
    {
        get;
        set;
    }
}

/// <summary>Recurring finding theme grouped by category and severity.</summary>
public sealed class SystemicIssueSummary
{
    public string Category
    {
        get;
        set;
    } = string.Empty;

    public string Severity
    {
        get;
        set;
    } = string.Empty;

    public int Count
    {
        get;
        set;
    }
}
