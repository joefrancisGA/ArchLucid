using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Workflow;

namespace ArchLucid.Decisioning.Alerts;

public sealed partial class AlertEvaluator
{
    private static void EvaluateCriticalRecommendationCount(
        AlertRule rule,
        AlertEvaluationContext context,
        List<AlertRecord> alerts)
    {
        int count = context.ImprovementPlan?.Recommendations.Count(x =>
            string.Equals(x.Urgency, AlertUrgencies.Critical, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(x.Urgency, AlertUrgencies.High, StringComparison.OrdinalIgnoreCase)) ?? 0;

        if (count >= rule.ThresholdValue)

            alerts.Add(BuildAlert(
                rule,
                context,
                "High number of critical/high-priority recommendations detected",
                AlertCategories.Advisory,
                count.ToString(),
                $"The current improvement plan contains {count} critical or high-priority recommendations.",
                null,
                $"critical-rec-count:{count}"));
    }

    private static void EvaluateDeferredHighPriorityAge(
        AlertRule rule,
        AlertEvaluationContext context,
        List<AlertRecord> alerts)
    {
        DateTime cutoff = TimeProvider.System.UtcNowDateTime().AddDays(-(double)rule.ThresholdValue);

        alerts.AddRange(
            AlertEvaluationRecordScope.ForRun(context)
                .Where(x =>
                    string.Equals(x.Status, RecommendationStatus.Deferred, StringComparison.OrdinalIgnoreCase) &&
                    x.PriorityScore >= 80 &&
                    x.LastUpdatedUtc <= cutoff)
                .Select(item => BuildAlert(
                    rule,
                    context,
                    "Deferred high-priority recommendation is aging",
                    AlertCategories.Recommendation,
                    item.LastUpdatedUtc.ToString("u"),
                    $"Recommendation '{item.Title}' has remained deferred beyond the configured threshold.",
                    item.RecommendationId,
                    $"deferred-aging:{item.RecommendationId}")));
    }

    private static void EvaluateRejectedSecurityRecommendation(
        AlertRule rule,
        AlertEvaluationContext context,
        List<AlertRecord> alerts)
    {
        alerts.AddRange(
            AlertEvaluationRecordScope.ForRun(context)
                .Where(x =>
                    string.Equals(x.Status, RecommendationStatus.Rejected, StringComparison.OrdinalIgnoreCase) &&
                    x.Category.Equals(AlertCategories.Security, StringComparison.OrdinalIgnoreCase))
                .Select(item => BuildAlert(
                    rule,
                    context,
                    "Security recommendation was rejected",
                    AlertCategories.Security,
                    item.RecommendationId.ToString(),
                    $"Security recommendation '{item.Title}' was rejected.",
                    item.RecommendationId,
                    $"rejected-security:{item.RecommendationId}")));
    }

    private static void EvaluateAcceptanceRateDrop(
        AlertRule rule,
        AlertEvaluationContext context,
        List<AlertRecord> alerts)
    {
        RecommendationLearningProfile? profile = context.LearningProfile;

        if (profile is null)
            return;

        int proposed = profile.CategoryStats.Sum(x => x.ProposedCount);
        double overall = proposed == 0
            ? 0d
            : profile.CategoryStats.Sum(x => x.AcceptedCount) / (double)proposed;

        double pct = overall * 100d;

        if (pct <= (double)rule.ThresholdValue)

            alerts.Add(BuildAlert(
                rule,
                context,
                "Recommendation acceptance rate is below threshold",
                AlertCategories.Learning,
                $"{pct:0.##}%",
                $"Overall recommendation acceptance rate is {pct:0.##}%, below the configured threshold.",
                null,
                $"accept-rate:{Math.Round(pct, 0)}"));
    }
}
