namespace ArchLucid.Api.Models.CustomerSuccess;

public sealed class OperatorNextBestActionResponse
{
    public string ActionId
    {
        get;
        set;
    } = "";

    public string Title
    {
        get;
        set;
    } = "";

    public string Reason
    {
        get;
        set;
    } = "";

    public string Href
    {
        get;
        set;
    } = "";
}

public sealed class PilotFunnelSnapshotResponse
{
    public DateTimeOffset? FirstRunCreatedUtc
    {
        get;
        set;
    }

    public DateTimeOffset? FirstGoldenManifestUtc
    {
        get;
        set;
    }

    public DateTimeOffset? FirstComparisonUtc
    {
        get;
        set;
    }

    public DateTimeOffset? FirstArtifactOrBundleDownloadUtc
    {
        get;
        set;
    }

    public DateTimeOffset? FirstReplayUtc
    {
        get;
        set;
    }

    public int TotalRunsInScope
    {
        get;
        set;
    }

    public int CommittedRunsInScope
    {
        get;
        set;
    }

    public int ProductLearningSignalsLast90Days
    {
        get;
        set;
    }
}

/// <summary>Funnel milestones plus operator habit signals for customer-success surfaces.</summary>
public sealed class OperatorStickinessSnapshotResponse
{
    public PilotFunnelSnapshotResponse PilotFunnel
    {
        get;
        set;
    } = new();

    public Guid? LatestRunId
    {
        get;
        set;
    }

    public int ComparisonEventsLast30Days
    {
        get;
        set;
    }

    public int PendingGovernanceApprovals
    {
        get;
        set;
    }
}
