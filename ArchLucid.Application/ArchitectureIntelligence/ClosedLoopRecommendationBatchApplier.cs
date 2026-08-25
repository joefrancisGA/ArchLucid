using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Applies every recommendation onto an evolving κ instead of only <c>recommendations[0]</c>.
/// </summary>
public sealed class ClosedLoopRecommendationBatchApplier
{
    private readonly IArchitectureModelDiffApplier _modelDiffApplier;
    private readonly IChangeImpactAnalyzer _changeImpactAnalyzer;

    public ClosedLoopRecommendationBatchApplier(
        IArchitectureModelDiffApplier modelDiffApplier,
        IChangeImpactAnalyzer changeImpactAnalyzer)
    {
        _modelDiffApplier = modelDiffApplier ?? throw new ArgumentNullException(nameof(modelDiffApplier));
        _changeImpactAnalyzer = changeImpactAnalyzer ?? throw new ArgumentNullException(nameof(changeImpactAnalyzer));
    }

    public ClosedLoopRecommendationBatchApplyResult Apply(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<ArchitectureRecommendation> recommendations)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(recommendations);

        ArchitectureKnowledgeModel workingModel = model;
        List<ArchitectureModelDiff> modelDiffs = [];
        List<ChangeImpactResult> impactResults = [];
        HashSet<string> affectedElementIds = new(StringComparer.Ordinal);
        bool requiresFullReReview = false;
        ReReviewTrigger? trigger = null;

        foreach (ArchitectureRecommendation recommendation in recommendations)
        {
            ArgumentNullException.ThrowIfNull(recommendation);

            ArchitectureModelDiff diff = _modelDiffApplier.ApplyRecommendation(workingModel, recommendation);
            modelDiffs.Add(diff);
            workingModel = diff.AfterModel ?? workingModel;

            ChangeImpactResult impact = _changeImpactAnalyzer.Analyze(diff, recommendation);
            impactResults.Add(impact);

            foreach (ChangeImpactItem item in impact.ImpactedItems ?? [])
            {
                if (string.IsNullOrWhiteSpace(item.ElementId))
                    continue;

                affectedElementIds.Add(item.ElementId);
            }

            if (!impact.RequiresFullReReview)
                continue;

            requiresFullReReview = true;
            trigger ??= ClosedLoopReReviewTriggerResolver.Resolve(impact, recommendation);
        }

        return new ClosedLoopRecommendationBatchApplyResult
        {
            WorkingModel = workingModel,
            ModelDiffs = modelDiffs,
            ImpactResults = impactResults,
            Scope = new ReReviewScope
            {
                AffectedElementIds = affectedElementIds.ToList(),
                IncludeGlobalInvariantChecks = true,
                FullReReview = requiresFullReReview,
                Trigger = trigger,
            },
        };
    }
}
