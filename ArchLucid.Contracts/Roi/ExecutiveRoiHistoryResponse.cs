namespace ArchLucid.Contracts.Roi;

/// <summary>One historical executive ROI snapshot for trend charts.</summary>
public sealed class ExecutiveRoiHistoryPoint
{
    public DateTimeOffset SnapshotUtc
    {
        get;
        init;
    }

    public decimal TotalEstimatedUsdSavings
    {
        get;
        init;
    }

    public int CriticalSecurityFindings
    {
        get;
        init;
    }
}

/// <summary>Longitudinal executive ROI series (typically last six months).</summary>
public sealed class ExecutiveRoiHistoryResponse
{
    public IReadOnlyList<ExecutiveRoiHistoryPoint> Points
    {
        get;
        init;
    } = [];
}
