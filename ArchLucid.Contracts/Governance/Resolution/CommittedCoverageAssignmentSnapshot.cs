namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>One coverage assignment row frozen on committed review packages.</summary>
public sealed class CommittedCoverageAssignmentSnapshot
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string PolicyPackVersion
    {
        get;
        set;
    } = null!;

    public string CoverageType
    {
        get;
        set;
    } = null!;

    public string SelectionState
    {
        get;
        set;
    } = null!;

    public string? RecommendationConfidence
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

    public string? QualityDimension
    {
        get;
        set;
    }

    public string EvaluationVersion
    {
        get;
        set;
    } = null!;
}
