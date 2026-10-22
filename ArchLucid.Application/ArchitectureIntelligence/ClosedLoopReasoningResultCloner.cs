using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Isolates cached closed-loop results from caller mutations and concurrent cache hits.
/// </summary>
internal static partial class ClosedLoopReasoningResultCloner
{
    public static ClosedLoopReasoningResult Clone(ClosedLoopReasoningResult source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ClosedLoopReasoningResult
        {
            Model = ArchitectureKnowledgeModelCloner.Clone(source.Model),
            Interview = CloneInterview(source.Interview),
            SpecialistReviews = source.SpecialistReviews.Select(CloneSpecialistReview).ToList(),
            Adversarial = CloneAdversarial(source.Adversarial),
            Recommendations = source.Recommendations.Select(CloneRecommendation).ToList(),
            ImpactResults = source.ImpactResults.Select(CloneImpact).ToList(),
            ReReview = source.ReReview is null ? null : CloneReReview(source.ReReview),
            GoldenMetrics = source.GoldenMetrics is null ? null : CloneGoldenMetrics(source.GoldenMetrics),
            MustNotFailViolations = source.MustNotFailViolations.Select(CloneMustNotFailViolation).ToList(),
            ValidationResults = source.ValidationResults.Select(CloneValidationResult).ToList(),
            ProductFindings = source.ProductFindings.Select(CloneProductFinding).ToList(),
            ProductRecommendations = source.ProductRecommendations.Select(CloneProductRecommendation).ToList(),
            PublishBlocked = source.PublishBlocked,
            ReviewCompleteBlocked = source.ReviewCompleteBlocked,
            PublishBlockReasons = source.PublishBlockReasons.ToList(),
            IntegrityPassedFindingIds = source.IntegrityPassedFindingIds.ToList(),
            ModelDiffs = source.ModelDiffs.Select(CloneModelDiff).ToList(),
            RunId = source.RunId,
            ModelId = source.ModelId,
            PublishedToProduct = source.PublishedToProduct,
            PublishedFindingsSnapshotId = source.PublishedFindingsSnapshotId,
            PublishedRecommendationCount = source.PublishedRecommendationCount,
            PublishSkipReason = source.PublishSkipReason,
            CacheHit = source.CacheHit,
            CacheReuseReason = source.CacheReuseReason,
            BudgetRejected = source.BudgetRejected,
            BudgetRejectReason = source.BudgetRejectReason,
            BudgetEstimatedTokens = source.BudgetEstimatedTokens,
            BudgetMaxTokens = source.BudgetMaxTokens,
            BudgetEstimatedCostUsd = source.BudgetEstimatedCostUsd,
            BudgetRemainingUsd = source.BudgetRemainingUsd,
            BudgetEnforced = source.BudgetEnforced,
        };
    }
}
