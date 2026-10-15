using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning;

/// <summary>
///     Main read model for the operator product-learning dashboard: rollups, trends, opportunities, and triage queue.
/// </summary>
public sealed class LearningDashboardSummary
{
    public DateTime GeneratedUtc
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public int TotalSignalsInScope
    {
        get;
        init;
    }

    /// <summary>Distinct architecture runs touched by any signal in scope (when run ids are present on signals).</summary>
    public int DistinctRunsTouched
    {
        get;
        init;
    }

    private IReadOnlyList<FeedbackAggregate> topAggregates = [];

    public IReadOnlyList<FeedbackAggregate> TopAggregates
    {
        get => topAggregates;
        init => topAggregates = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ArtifactOutcomeTrend> artifactTrends = [];

    public IReadOnlyList<ArtifactOutcomeTrend> ArtifactTrends
    {
        get => artifactTrends;
        init => artifactTrends = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ImprovementOpportunity> opportunities = [];

    public IReadOnlyList<ImprovementOpportunity> Opportunities
    {
        get => opportunities;
        init => opportunities = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<TriageQueueItem> triageQueue = [];

    public IReadOnlyList<TriageQueueItem> TriageQueue
    {
        get => triageQueue;
        init => triageQueue = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> summaryNotes = [];

    /// <summary>Optional human-readable bullets for the dashboard header (filled by services later).</summary>
    public IReadOnlyList<string> SummaryNotes
    {
        get => summaryNotes;
        init => summaryNotes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
