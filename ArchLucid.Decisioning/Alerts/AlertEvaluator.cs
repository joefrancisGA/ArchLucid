using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Alerts;

/// <summary>
///     Stateless evaluator: maps each enabled <see cref="AlertRule" /> to zero or one <see cref="AlertRecord" /> using
///     metrics from <see cref="AlertEvaluationContext" />.
/// </summary>
/// <remarks>
///     Invoked from <c>ArchLucid.Persistence.Alerts.AlertService</c> after rules are filtered by
///     <see cref="PolicyPackGovernanceFilter" />.
///     Does not persist or deduplicate; callers own repository and delivery.
/// </remarks>
public sealed partial class AlertEvaluator : IAlertEvaluator
{
    /// <inheritdoc />
    /// <remarks>
    ///     Only rules with <see cref="AlertRule.IsEnabled" /> are considered. Unknown <see cref="AlertRuleType" /> values
    ///     are skipped.
    /// </remarks>
    public IReadOnlyList<AlertRecord> Evaluate(
        IReadOnlyList<AlertRule> rules,
        AlertEvaluationContext context)
    {
        ArgumentNullException.ThrowIfNull(rules);
        ArgumentNullException.ThrowIfNull(context);
        List<AlertRecord> alerts = [];

        foreach (AlertRule rule in rules.Where(x => x.IsEnabled))

            switch (rule.RuleType)
            {
                case AlertRuleType.CriticalRecommendationCount:
                    EvaluateCriticalRecommendationCount(rule, context, alerts);
                    break;

                case AlertRuleType.NewComplianceGapCount:
                    EvaluateNewComplianceGapCount(rule, context, alerts);
                    break;

                case AlertRuleType.CostIncreasePercent:
                    EvaluateCostIncreasePercent(rule, context, alerts);
                    break;

                case AlertRuleType.DeferredHighPriorityRecommendationAgeDays:
                    EvaluateDeferredHighPriorityAge(rule, context, alerts);
                    break;

                case AlertRuleType.RejectedSecurityRecommendation:
                    EvaluateRejectedSecurityRecommendation(rule, context, alerts);
                    break;

                case AlertRuleType.AcceptanceRateDrop:
                    EvaluateAcceptanceRateDrop(rule, context, alerts);
                    break;
            }

        return alerts;
    }

    private static AlertRecord BuildAlert(
        AlertRule rule,
        AlertEvaluationContext context,
        string title,
        string category,
        string triggerValue,
        string description,
        Guid? recommendationId,
        string dedupeSuffix)
    {
        return new AlertRecord
        {
            AlertId = Guid.NewGuid(),
            RuleId = rule.RuleId,
            TenantId = context.TenantId,
            WorkspaceId = context.WorkspaceId,
            ProjectId = context.ProjectId,
            RunId = context.RunId,
            ComparedToRunId = context.ComparedToRunId,
            RecommendationId = recommendationId,
            Title = title,
            Category = category,
            Severity = rule.Severity,
            Status = AlertStatus.Open,
            TriggerValue = triggerValue,
            Description = description,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            DeduplicationKey = $"{rule.RuleId}:{dedupeSuffix}"
        };
    }
}
