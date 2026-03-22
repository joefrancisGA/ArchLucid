using ArchiForge.Decisioning.Advisory.Workflow;

namespace ArchiForge.Decisioning.Alerts.Composite;

public sealed class AlertMetricSnapshotBuilder : IAlertMetricSnapshotBuilder
{
    public AlertMetricSnapshot Build(AlertEvaluationContext context)
    {
        var snapshot = new AlertMetricSnapshot
        {
            CriticalRecommendationCount =
                context.ImprovementPlan?.Recommendations.Count(x =>
                    string.Equals(x.Urgency, "Critical", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(x.Urgency, "High", StringComparison.OrdinalIgnoreCase)) ?? 0,

            NewComplianceGapCount =
                context.ComparisonResult?.SecurityChanges.Count ?? 0,

            DeferredHighPriorityRecommendationCount =
                context.RecommendationRecords.Count(x =>
                    string.Equals(x.Status, RecommendationStatus.Deferred, StringComparison.OrdinalIgnoreCase) &&
                    x.PriorityScore >= 80),

            RejectedSecurityRecommendationCount =
                context.RecommendationRecords.Count(x =>
                    string.Equals(x.Status, RecommendationStatus.Rejected, StringComparison.OrdinalIgnoreCase) &&
                    x.Category.Equals("Security", StringComparison.OrdinalIgnoreCase)),

            AcceptanceRatePercent = BuildAcceptanceRatePercent(context),
        };

        snapshot.CostIncreasePercent = BuildCostIncreasePercent(context);
        return snapshot;
    }

    private static decimal BuildCostIncreasePercent(AlertEvaluationContext context)
    {
        var delta = context.ComparisonResult?.CostChanges.FirstOrDefault();
        if (delta?.BaseCost is null || delta.TargetCost is null || delta.BaseCost == 0)
            return 0;

        return ((delta.TargetCost.Value - delta.BaseCost.Value) / delta.BaseCost.Value) * 100m;
    }

    private static decimal BuildAcceptanceRatePercent(AlertEvaluationContext context)
    {
        var profile = context.LearningProfile;
        if (profile is null)
            return 0;

        var proposed = profile.CategoryStats.Sum(x => x.ProposedCount);
        if (proposed == 0)
            return 0;

        var accepted = profile.CategoryStats.Sum(x => x.AcceptedCount);
        return (decimal)accepted / proposed * 100m;
    }
}
