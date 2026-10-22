namespace ArchLucid.Application.Operator;

/// <summary>Stickiness read-model bundled into <see cref="OperatorShellStatusResult"/>.</summary>
public sealed class OperatorShellStickinessSnapshot
{
    public OperatorShellPilotFunnelSnapshot PilotFunnel { get; init; } = new();

    public Guid? LatestRunId { get; init; }

    public int ComparisonEventsLast30Days { get; init; }

    public int PendingGovernanceApprovals { get; init; }
}

/// <summary>Pilot funnel milestones for operator shell stickiness bundle.</summary>
public sealed class OperatorShellPilotFunnelSnapshot
{
    public DateTimeOffset? FirstRunCreatedUtc { get; init; }

    public DateTimeOffset? FirstGoldenManifestUtc { get; init; }

    public DateTimeOffset? FirstComparisonUtc { get; init; }

    public DateTimeOffset? FirstArtifactOrBundleDownloadUtc { get; init; }

    public DateTimeOffset? FirstReplayUtc { get; init; }

    public int TotalRunsInScope { get; init; }

    public int CommittedRunsInScope { get; init; }

    public int ProductLearningSignalsLast90Days { get; init; }
}
