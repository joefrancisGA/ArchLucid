namespace ArchiForge.Decisioning.Alerts.Composite;

public sealed class CompositeAlertRuleEvaluator : ICompositeAlertRuleEvaluator
{
    public bool Evaluate(CompositeAlertRule rule, AlertMetricSnapshot snapshot)
    {
        if (rule.Conditions.Count == 0)
            return false;

        var results = rule.Conditions.Select(condition =>
            EvaluateCondition(condition, snapshot)).ToList();

        return rule.Operator switch
        {
            CompositeOperator.And => results.All(x => x),
            CompositeOperator.Or => results.Any(x => x),
            _ => false,
        };
    }

    private static bool EvaluateCondition(AlertRuleCondition condition, AlertMetricSnapshot snapshot)
    {
        var actual = ResolveMetric(condition.MetricType, snapshot);
        var expected = condition.ThresholdValue;

        return condition.Operator switch
        {
            AlertConditionOperator.GreaterThanOrEqual => actual >= expected,
            AlertConditionOperator.GreaterThan => actual > expected,
            AlertConditionOperator.LessThanOrEqual => actual <= expected,
            AlertConditionOperator.LessThan => actual < expected,
            AlertConditionOperator.Equal => actual == expected,
            AlertConditionOperator.NotEqual => actual != expected,
            _ => false,
        };
    }

    private static decimal ResolveMetric(string metricType, AlertMetricSnapshot snapshot)
    {
        return metricType switch
        {
            AlertMetricType.CriticalRecommendationCount => snapshot.CriticalRecommendationCount,
            AlertMetricType.NewComplianceGapCount => snapshot.NewComplianceGapCount,
            AlertMetricType.CostIncreasePercent => snapshot.CostIncreasePercent,
            AlertMetricType.DeferredHighPriorityRecommendationCount => snapshot.DeferredHighPriorityRecommendationCount,
            AlertMetricType.RejectedSecurityRecommendationCount => snapshot.RejectedSecurityRecommendationCount,
            AlertMetricType.AcceptanceRatePercent => snapshot.AcceptanceRatePercent,
            _ => 0,
        };
    }
}
