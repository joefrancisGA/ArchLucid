using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;

namespace ArchLucid.Application.Advisory;

public enum ImprovementsPlanLoadOutcome
{
    Success,
    RunNotFound,
    ManifestNotFound,
    ComparisonRunNotFound,
    ComparisonManifestNotFound,
}

public sealed record ImprovementsPlanLoadResult
{
    public required ImprovementsPlanLoadOutcome Outcome { get; init; }

    public ImprovementPlan? Plan { get; init; }

    public Guid RunId { get; init; }

    public int AdvisoryFindingCount { get; init; }
}

public sealed record AdvisoryRecommendationsListResult
{
    public required IReadOnlyList<RecommendationRecord> Recommendations { get; init; }

    public string? ImproveLoopEvidenceJson { get; init; }
}

public enum ApplyRecommendationActionOutcome
{
    Success,
    NotFound,
}

public sealed record ApplyRecommendationActionFacadeResult
{
    public required ApplyRecommendationActionOutcome Outcome { get; init; }

    public Guid RecommendationId { get; init; }

    public RecommendationRecord? Updated { get; init; }

    public RecommendationImproveLoopResult? ImproveLoop { get; init; }
}
