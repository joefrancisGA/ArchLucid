namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>
///     One persisted coverage decision for a policy pack at tenant or run scope. Append-only; reruns create new rows.
/// </summary>
public sealed class CoverageAssignment
{
    public Guid CoverageAssignmentId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    /// <summary>Null for tenant-level defaults; set for a specific run's resolved coverage.</summary>
    public string? RunId
    {
        get;
        set;
    }

    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string PolicyPackVersion
    {
        get;
        set;
    } = string.Empty;

    public CoverageType CoverageType
    {
        get;
        set;
    }

    public CoverageSelectionState SelectionState
    {
        get;
        set;
    }

    public RecommendationConfidence? RecommendationConfidence
    {
        get;
        set;
    }

    public string? RecommendationTrigger
    {
        get;
        set;
    }

    public string? RecommendationRationale
    {
        get;
        set;
    }

    public string? TriggeringEvidenceRef
    {
        get;
        set;
    }

    public string? ExclusionReason
    {
        get;
        set;
    }

    public string ActorUserId
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    /// <summary>Baseline/recommendation-logic version that produced this row (distinct from PolicyPackVersion).</summary>
    public string EvaluationVersion
    {
        get;
        set;
    } = string.Empty;
}
