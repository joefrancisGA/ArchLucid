using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Api.Contracts;

/// <summary>
///     Response for <c>POST /v1/advisory/recommendations/{id}/action</c> including optional Improve-loop evidence.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class RecommendationActionResponse
{
    public RecommendationRecordResponse Recommendation
    {
        get;
        set;
    } = null!;

    public RecommendationImproveLoopEvidenceResponse? ImproveLoop
    {
        get;
        set;
    }
}

/// <summary>
///     Diff, impact, disclaimer, and merged finding ids from the human apply → improve loop.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class RecommendationImproveLoopEvidenceResponse
{
    public List<ArchitectureModelDiffEntry> DiffEntries
    {
        get;
        set;
    } = [];

    public ChangeImpactResult? Impact
    {
        get;
        set;
    }

    public string? PartialScopeDisclaimer
    {
        get;
        set;
    }

    public List<string> MergedFindingIds
    {
        get;
        set;
    } = [];

    public bool FullReReviewTriggered
    {
        get;
        set;
    }
}
