using ArchLucid.Core.Comparison;
using ArchLucid.Decisioning.Advisory.Analysis;

namespace ArchLucid.Decisioning.Alerts;

public sealed partial class AlertEvaluator
{
    private static void EvaluateNewComplianceGapCount(
        AlertRule rule,
        AlertEvaluationContext context,
        List<AlertRecord> alerts)
    {
        int count = context.ComparisonResult is null
            ? 0
            : SecurityDeltaRegressionClassifier.CountRegressions(context.ComparisonResult.SecurityChanges);

        if (count >= rule.ThresholdValue)

            alerts.Add(BuildAlert(
                rule,
                context,
                "New compliance or security delta threshold exceeded",
                AlertCategories.Compliance,
                count.ToString(),
                $"The latest comparison produced {count} relevant compliance/security deltas.",
                null,
                $"comp-gap-count:{count}"));
    }
}
