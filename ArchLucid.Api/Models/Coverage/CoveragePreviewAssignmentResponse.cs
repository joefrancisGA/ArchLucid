using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance.Coverage;

namespace ArchLucid.Api.Models.Coverage;

[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class CoveragePreviewAssignmentResponse
{
    public string PolicyPackId
    {
        get;
        init;
    } = string.Empty;

    public string PolicyPackDisplayName
    {
        get;
        init;
    } = string.Empty;

    public string PolicyPackVersion
    {
        get;
        init;
    } = string.Empty;

    public CoverageType CoverageType
    {
        get;
        init;
    }

    public CoverageSelectionState SelectionState
    {
        get;
        init;
    }

    public RecommendationConfidence? RecommendationConfidence
    {
        get;
        init;
    }

    public string? RecommendationTrigger
    {
        get;
        init;
    }

    public string? RecommendationRationale
    {
        get;
        init;
    }

    public string? TriggeringEvidenceRef
    {
        get;
        init;
    }

    public QualityDimension? QualityDimension
    {
        get;
        init;
    }

    public bool IncludedInRunEvaluation
    {
        get;
        init;
    }

    public string EvaluationVersion
    {
        get;
        init;
    } = string.Empty;
}
