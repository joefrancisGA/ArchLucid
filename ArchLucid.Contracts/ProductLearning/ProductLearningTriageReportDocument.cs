using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning;

/// <summary>
///     Structured product-learning triage report for JSON export and programmatic review (58R).
///     Excludes raw comments and low-level noise; aligns with the markdown triage report.
/// </summary>
public sealed class ProductLearningTriageReportDocument
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

    /// <summary>UTC lower bound used for this report, if any; otherwise null (all time).</summary>
    public DateTime? SinceUtc
    {
        get;
        init;
    }

    public int TotalSignalsInScope
    {
        get;
        init;
    }

    /// <summary>Same count as <see cref="LearningDashboardSummary.DistinctRunsTouched" /> (export naming).</summary>
    public int DistinctRunsReviewed
    {
        get;
        init;
    }

    private IReadOnlyList<ProductLearningTriageReportArtifactRow> artifactOutcomes = [];

    public IReadOnlyList<ProductLearningTriageReportArtifactRow> ArtifactOutcomes
    {
        get => artifactOutcomes;
        init => artifactOutcomes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> topProblemAreas = [];

    /// <summary>Short bullets for recurring pain (aggregates + opportunities, deduplicated).</summary>
    public IReadOnlyList<string> TopProblemAreas
    {
        get => topProblemAreas;
        init => topProblemAreas = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ProductLearningTriageReportImprovementLine> topImprovements = [];

    public IReadOnlyList<ProductLearningTriageReportImprovementLine> TopImprovements
    {
        get => topImprovements;
        init => topImprovements = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ProductLearningTriageReportTriageLine> triageQueuePreview = [];

    public IReadOnlyList<ProductLearningTriageReportTriageLine> TriageQueuePreview
    {
        get => triageQueuePreview;
        init => triageQueuePreview = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
