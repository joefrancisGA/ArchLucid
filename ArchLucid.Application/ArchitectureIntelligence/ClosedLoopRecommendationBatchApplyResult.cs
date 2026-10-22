using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Sequential apply of every closed-loop recommendation onto one evolving κ, plus a single re-review scope.
/// </summary>
public sealed class ClosedLoopRecommendationBatchApplyResult
{
    public ArchitectureKnowledgeModel WorkingModel { get; init; } = new();

    public List<ArchitectureModelDiff> ModelDiffs { get; init; } = [];

    public List<ChangeImpactResult> ImpactResults { get; init; } = [];

    public ReReviewScope Scope { get; init; } = new();
}
