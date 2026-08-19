namespace ArchLucid.Contracts.Roi;

/// <summary>One historical sponsor ROI snapshot for trend charts.</summary>
public sealed class SponsorRoiHistoryPoint
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

    /// <summary>Committed runs in this period with <see cref="Common.StructuralExecutionMode.Real"/>.</summary>
    public int RealRunCount
    {
        get;
        init;
    }

    /// <summary>Committed runs in this period with structural mode other than Real (simulator, fallback, mixed).</summary>
    public int SimulatorRunCount
    {
        get;
        init;
    }

    /// <summary>Savings attributed to Real-mode runs: total × real/(real+simulator).</summary>
    public decimal RealModeSavingsUsd
    {
        get;
        init;
    }

    /// <summary>True when both Real and non-Real runs contributed to this period.</summary>
    public bool IsMixedMode
    {
        get;
        init;
    }
}

/// <summary>Longitudinal sponsor ROI series (typically last six months).</summary>
public sealed class SponsorRoiHistoryResponse
{
    public IReadOnlyList<SponsorRoiHistoryPoint> Points
    {
        get;
        init;
    } = [];
}
