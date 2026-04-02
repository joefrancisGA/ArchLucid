namespace ArchiForge.Contracts.ProductLearning;

/// <summary>
/// Main read model for the operator product-learning dashboard: rollups, trends, opportunities, and triage queue.
/// </summary>
public sealed class LearningDashboardSummary
{
    public DateTime GeneratedUtc { get; init; }
    public Guid TenantId { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid ProjectId { get; init; }
    public int TotalSignalsInScope { get; init; }

    /// <summary>Distinct architecture runs touched by any signal in scope (when run ids are present on signals).</summary>
    public int DistinctRunsTouched { get; init; }
    public IReadOnlyList<FeedbackAggregate> TopAggregates { get; init; } = Array.Empty<FeedbackAggregate>();
    public IReadOnlyList<ArtifactOutcomeTrend> ArtifactTrends { get; init; } = Array.Empty<ArtifactOutcomeTrend>();
    public IReadOnlyList<ImprovementOpportunity> Opportunities { get; init; } = Array.Empty<ImprovementOpportunity>();
    public IReadOnlyList<TriageQueueItem> TriageQueue { get; init; } = Array.Empty<TriageQueueItem>();

    /// <summary>Optional human-readable bullets for the dashboard header (filled by services later).</summary>
    public IReadOnlyList<string> SummaryNotes { get; init; } = Array.Empty<string>();
}
