namespace ArchLucid.Persistence.Alerts;

internal static class CompositeAlertRuleRepositoryCore
{
    public const int MaxListByScope = 200;

    public static CompositeAlertRule CloneRule(CompositeAlertRule rule)
    {
        ArgumentNullException.ThrowIfNull(rule);

        return new CompositeAlertRule
        {
            CompositeRuleId = rule.CompositeRuleId,
            TenantId = rule.TenantId,
            WorkspaceId = rule.WorkspaceId,
            ProjectId = rule.ProjectId,
            Name = rule.Name,
            Severity = rule.Severity,
            Operator = rule.Operator,
            IsEnabled = rule.IsEnabled,
            SuppressionWindowMinutes = rule.SuppressionWindowMinutes,
            CooldownMinutes = rule.CooldownMinutes,
            ReopenDeltaThreshold = rule.ReopenDeltaThreshold,
            DedupeScope = rule.DedupeScope,
            TargetChannelType = rule.TargetChannelType,
            CreatedUtc = rule.CreatedUtc,
            Conditions = rule.Conditions
                .Select(
                    c => new AlertRuleCondition
                    {
                        ConditionId = c.ConditionId,
                        MetricType = c.MetricType,
                        Operator = c.Operator,
                        ThresholdValue = c.ThresholdValue,
                    })
                .ToList(),
        };
    }

    public static IEnumerable<CompositeAlertRule> FilterByScope(
        IEnumerable<CompositeAlertRule> rules,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(rules);

        return rules
            .Where(x => x.TenantId == tenantId && x.WorkspaceId == workspaceId && x.ProjectId == projectId)
            .OrderByDescending(x => x.CreatedUtc);
    }

    public static IEnumerable<CompositeAlertRule> FilterEnabledByScope(
        IEnumerable<CompositeAlertRule> rules,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(rules);

        return rules
            .Where(x =>
                x.TenantId == tenantId
                && x.WorkspaceId == workspaceId
                && x.ProjectId == projectId
                && x.IsEnabled)
            .OrderByDescending(x => x.CreatedUtc);
    }

    public static void AttachConditions(
        IEnumerable<CompositeAlertRule> rules,
        IReadOnlyDictionary<Guid, IReadOnlyList<AlertRuleCondition>> conditionsByRuleId)
    {
        ArgumentNullException.ThrowIfNull(rules);
        ArgumentNullException.ThrowIfNull(conditionsByRuleId);

        foreach (CompositeAlertRule rule in rules)
        {
            rule.Conditions.Clear();

            if (!conditionsByRuleId.TryGetValue(rule.CompositeRuleId, out IReadOnlyList<AlertRuleCondition>? conditions))
                continue;

            foreach (AlertRuleCondition condition in conditions)
                rule.Conditions.Add(condition);
        }
    }
}
