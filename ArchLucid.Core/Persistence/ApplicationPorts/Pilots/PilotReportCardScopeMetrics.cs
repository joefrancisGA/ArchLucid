namespace ArchLucid.Persistence.Pilots;

/// <summary>Raw metrics produced by <see cref="IPilotReportCardMetricsReader" /> prior to contracts mapping.</summary>
public sealed class PilotReportCardScopeMetrics
{
    public int TotalCompletedRuns
    {
        get;
        init;
    }

    public DateTime? PeriodStartUtc
    {
        get;
        init;
    }

    public DateTime? PeriodEndUtc
    {
        get;
        init;
    }

    public double? AverageRequestToCommitWallSeconds
    {
        get;
        init;
    }

    public int TotalFindings
    {
        get;
        init;
    }

    public IReadOnlyList<PilotReportCardSeverityCountRow> FindingsBySeverity
    {
        get;
        init;
    }
        = [];

    public int GovernanceApprovalActions
    {
        get;
        init;
    }

    public int GovernanceRejections
    {
        get;
        init;
    }

    public long ExportsGenerated
    {
        get;
        init;
    }

    public int UniqueSynthesizedArtifactTypes
    {
        get;
        init;
    }
}
