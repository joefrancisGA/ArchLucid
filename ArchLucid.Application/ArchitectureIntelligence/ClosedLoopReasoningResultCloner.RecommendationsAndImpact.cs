using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static partial class ClosedLoopReasoningResultCloner
{
    private static ArchitectureRecommendation CloneRecommendation(ArchitectureRecommendation recommendation)
    {
        return new ArchitectureRecommendation
        {
            RecommendationId = recommendation.RecommendationId,
            Problem = recommendation.Problem,
            Evidence = recommendation.Evidence,
            AffectedRequirementOrQualityAttribute = recommendation.AffectedRequirementOrQualityAttribute,
            ConsequenceOfInaction = recommendation.ConsequenceOfInaction,
            ProposedChange = recommendation.ProposedChange,
            Alternatives = recommendation.Alternatives.ToList(),
            AlternativeOptions = recommendation.AlternativeOptions.Select(CloneAlternativeOption).ToList(),
            TradeOffs = recommendation.TradeOffs.ToList(),
            Effort = recommendation.Effort,
            RiskReduction = recommendation.RiskReduction,
            Dependencies = recommendation.Dependencies.ToList(),
            ValidationMethod = recommendation.ValidationMethod,
            Confidence = recommendation.Confidence,
            RequiresHumanApproval = recommendation.RequiresHumanApproval,
            Provenance = ArchitectureKnowledgeModelCloner.CloneProvenance(recommendation.Provenance),
        };
    }

    private static RecommendationAlternative CloneAlternativeOption(RecommendationAlternative option)
    {
        return new RecommendationAlternative
        {
            Path = option.Path,
            ValidationCriteria = option.ValidationCriteria,
        };
    }

    private static ChangeImpactResult CloneImpact(ChangeImpactResult impact)
    {
        return new ChangeImpactResult
        {
            RecommendationId = impact.RecommendationId,
            ImpactedItems = impact.ImpactedItems?.Select(CloneImpactItem).ToList() ?? [],
            GraphCompletenessCaveat = impact.GraphCompletenessCaveat,
            RequiresFullReReview = impact.RequiresFullReReview,
        };
    }

    private static ChangeImpactItem CloneImpactItem(ChangeImpactItem item)
    {
        return new ChangeImpactItem
        {
            ElementId = item.ElementId,
            ImpactKind = item.ImpactKind,
            Description = item.Description,
            Category = item.Category,
        };
    }

    private static IncrementalReReviewResult CloneReReview(IncrementalReReviewResult reReview)
    {
        return new IncrementalReReviewResult
        {
            Scope = CloneReReviewScope(reReview.Scope),
            SpecialistResults = reReview.SpecialistResults.Select(CloneSpecialistReview).ToList(),
            GlobalInvariantResults = reReview.GlobalInvariantResults.Select(CloneGlobalInvariantResult).ToList(),
            FullReReviewTriggered = reReview.FullReReviewTriggered,
            PartialScopeDisclaimer = reReview.PartialScopeDisclaimer,
            MergedFindingIds = reReview.MergedFindingIds.ToList(),
        };
    }

    private static ReReviewScope CloneReReviewScope(ReReviewScope scope)
    {
        return new ReReviewScope
        {
            AffectedElementIds = scope.AffectedElementIds.ToList(),
            IncludeGlobalInvariantChecks = scope.IncludeGlobalInvariantChecks,
            FullReReview = scope.FullReReview,
            Trigger = scope.Trigger,
        };
    }

    private static GlobalInvariantCheckResult CloneGlobalInvariantResult(GlobalInvariantCheckResult result)
    {
        return new GlobalInvariantCheckResult
        {
            InvariantId = result.InvariantId,
            Passed = result.Passed,
            Detail = result.Detail,
        };
    }

    private static ArchitectureModelDiff CloneModelDiff(ArchitectureModelDiff diff)
    {
        return new ArchitectureModelDiff
        {
            RecommendationId = diff.RecommendationId,
            Entries = diff.Entries?.Select(CloneModelDiffEntry).ToList() ?? [],
            BeforeModel = diff.BeforeModel is null || diff.BeforeModel.Elements.Count == 0
                ? new ArchitectureKnowledgeModel()
                : ArchitectureKnowledgeModelCloner.Clone(diff.BeforeModel),
            AfterModel = diff.AfterModel is null || diff.AfterModel.Elements.Count == 0
                ? new ArchitectureKnowledgeModel()
                : ArchitectureKnowledgeModelCloner.Clone(diff.AfterModel),
        };
    }

    private static ArchitectureModelDiffEntry CloneModelDiffEntry(ArchitectureModelDiffEntry entry)
    {
        return new ArchitectureModelDiffEntry
        {
            ElementId = entry.ElementId,
            ChangeKind = entry.ChangeKind,
            ElementKind = entry.ElementKind,
            Description = entry.Description,
        };
    }

    private static GoldenArchitectureTestResult CloneGoldenMetrics(GoldenArchitectureTestResult metrics)
    {
        return new GoldenArchitectureTestResult
        {
            BeforeCounts = new Dictionary<string, int>(metrics.BeforeCounts),
            AfterCounts = new Dictionary<string, int>(metrics.AfterCounts),
            DeltaCounts = new Dictionary<string, int>(metrics.DeltaCounts),
            PlantedDefectRecall = metrics.PlantedDefectRecall,
            PlantedDefectsDetected = metrics.PlantedDefectsDetected.ToList(),
            PlantedDefectsMissed = metrics.PlantedDefectsMissed.ToList(),
            FalsePositiveCount = metrics.FalsePositiveCount,
            FalsePositivesByDimension = new Dictionary<string, int>(metrics.FalsePositivesByDimension),
            CategoryScores = metrics.CategoryScores.Select(CloneCategoryBenchmarkScore).ToList(),
            MutationChangedFindings = metrics.MutationChangedFindings,
            ReReviewTriggered = metrics.ReReviewTriggered,
            Passed = metrics.Passed,
            Notes = metrics.Notes,
        };
    }

    private static CategoryBenchmarkScore CloneCategoryBenchmarkScore(CategoryBenchmarkScore score)
    {
        return new CategoryBenchmarkScore
        {
            Category = score.Category,
            Score = score.Score,
            Detail = score.Detail,
        };
    }
}
