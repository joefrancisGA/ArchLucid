namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>One explainable coverage row for pre-execute preview (not persisted).</summary>
public sealed class CoveragePreviewAssignment
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string PolicyPackDisplayName
    {
        get;
        set;
    } = string.Empty;

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

    public QualityDimension? QualityDimension
    {
        get;
        set;
    }

    /// <summary>Whether this pack participates in governance evaluation for the proposed run scope.</summary>
    public bool IncludedInRunEvaluation
    {
        get;
        set;
    }

    public string EvaluationVersion
    {
        get;
        set;
    } = string.Empty;
}
