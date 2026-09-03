using ArchLucid.Core.Comparison;

namespace ArchLucid.Decisioning.Alerts;

public sealed partial class AlertEvaluator
{
    private static void EvaluateCostIncreasePercent(
        AlertRule rule,
        AlertEvaluationContext context,
        List<AlertRecord> alerts)
    {
        CostDelta? delta = context.ComparisonResult?.CostChanges.FirstOrDefault();

        if (delta?.BaseCost is null || delta.TargetCost is null || delta.BaseCost == 0)
            return;

        decimal increasePct = (delta.TargetCost.Value - delta.BaseCost.Value) / delta.BaseCost.Value * 100m;

        if (increasePct >= rule.ThresholdValue)

            alerts.Add(BuildAlert(
                rule,
                context,
                "Projected cost increase exceeded threshold",
                AlertCategories.Cost,
                $"{increasePct:0.##}%",
                $"Projected cost increased by {increasePct:0.##}% compared to the baseline run.",
                null,
                $"cost-increase:{Math.Round(increasePct, 0)}"));
    }
}
