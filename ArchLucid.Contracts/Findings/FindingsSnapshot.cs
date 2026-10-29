using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

public class FindingsSnapshot
{
    /// <summary>Snapshot container schema version.</summary>
    public int SchemaVersion
    {
        get;
        set;
    } = FindingsSchema.CurrentSnapshotVersion;

    public Guid FindingsSnapshotId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public Guid ContextSnapshotId
    {
        get;
        set;
    }

    public Guid GraphSnapshotId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    /// <summary>Whether the snapshot is sealed for manifest finalization (defaults to <see cref="FindingsSnapshotGenerationStatus.Complete" /> for legacy rows).</summary>
    private FindingsSnapshotGenerationStatus generationStatus = FindingsSnapshotGenerationStatus.Complete;

    public FindingsSnapshotGenerationStatus GenerationStatus
    {
        get => generationStatus;
        set => generationStatus = ContractCollectionDefaults.CoalesceFindingsSnapshotGenerationStatus(value);
    }

    /// <summary>Engines that threw during this snapshot build (empty when all engines succeeded).</summary>
    private List<FindingEngineFailure> engineFailures = [];

    public List<FindingEngineFailure> EngineFailures
    {
        get => engineFailures;
        set => engineFailures = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>
    ///     Set when the host uses a no-op evaluation-confidence enricher so operators can distinguish "not run" from "computed zero".
    /// </summary>
    public bool EvaluationConfidenceEnrichmentSkipped
    {
        get;
        set;
    }

    private List<Finding> findings = [];

    public List<Finding> Findings
    {
        get => findings;
        set => findings = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Basic hygiene observations demoted from the decision-grade findings list (TB-384).</summary>
    private List<Finding> checklistCoverage = [];

    public List<Finding> ChecklistCoverage
    {
        get => checklistCoverage;
        set => checklistCoverage = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Findings the kernel refused to persist or demoted during merge (DR-02).</summary>
    private List<WithheldFindingSummary> withheldFindings = [];

    public List<WithheldFindingSummary> WithheldFindings
    {
        get => withheldFindings;
        set => withheldFindings = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Insight-density demotion vs retention counts for operator UI framing (TB-385).</summary>
    public InsightDensityCurationSummary? InsightDensityCuration
    {
        get;
        set;
    }

    /// <summary>Sum of projected impact for all accepted Cost-related findings in the run.</summary>
    public decimal TotalEstimatedSavings
    {
        get;
        set;
    }

    public IReadOnlyList<Finding> GetByCategory(string category)
    {
        return Findings
            .Where(f => string.Equals(f.Category, category, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public IReadOnlyList<Finding> GetByType(string findingType)
    {
        return Findings
            .Where(f => string.Equals(f.FindingType, findingType, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}
