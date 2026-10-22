using ArchLucid.Contracts.Alerts;
using AlertRuleCondition = ArchLucid.Contracts.Alerts.Composite.AlertRuleCondition;
using CompositeAlertRule = ArchLucid.Contracts.Alerts.Composite.CompositeAlertRule;

namespace ArchLucid.Decisioning.Alerts.Tuning;

public sealed partial class ThresholdRecommendationService
{
    private static AlertRule AlignSimpleRuleMetric(AlertRule source, string tunedMetricType)
    {
        AlertRule copy = CloneSimpleRuleWithThreshold(source, source.ThresholdValue);

        if (!string.IsNullOrWhiteSpace(tunedMetricType))
            copy.RuleType = tunedMetricType.Trim();
        return copy;
    }

    private static AlertRule CloneSimpleRuleWithThreshold(AlertRule source, decimal threshold)
    {
        return new AlertRule
        {
            RuleId = source.RuleId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            Name = source.Name,
            RuleType = source.RuleType,
            Severity = source.Severity,
            ThresholdValue = threshold,
            IsEnabled = source.IsEnabled,
            TargetChannelType = source.TargetChannelType,
            MetadataJson = source.MetadataJson,
            CreatedUtc = source.CreatedUtc
        };
    }

    private static CompositeAlertRule CloneCompositeRuleWithThreshold(
        CompositeAlertRule source,
        string tunedMetricType,
        decimal threshold)
    {
        return new CompositeAlertRule
        {
            CompositeRuleId = source.CompositeRuleId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            Name = source.Name,
            Severity = source.Severity,
            Operator = source.Operator,
            IsEnabled = source.IsEnabled,
            SuppressionWindowMinutes = source.SuppressionWindowMinutes,
            CooldownMinutes = source.CooldownMinutes,
            ReopenDeltaThreshold = source.ReopenDeltaThreshold,
            DedupeScope = source.DedupeScope,
            TargetChannelType = source.TargetChannelType,
            CreatedUtc = source.CreatedUtc,
            Conditions = source.Conditions
                .Select(c => new AlertRuleCondition
                {
                    ConditionId = c.ConditionId,
                    MetricType = c.MetricType,
                    Operator = c.Operator,
                    ThresholdValue = c.MetricType.Equals(tunedMetricType, StringComparison.OrdinalIgnoreCase)
                        ? threshold
                        : c.ThresholdValue
                })
                .ToList()
        };
    }
}
