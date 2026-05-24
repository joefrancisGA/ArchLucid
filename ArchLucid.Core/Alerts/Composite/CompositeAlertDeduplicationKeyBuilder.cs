using ArchLucid.Contracts.Alerts.Composite;

namespace ArchLucid.Core.Alerts.Composite;

public static class CompositeAlertDeduplicationKeyBuilder
{
    private const string KeyPrefixComposite = "composite";
    private const string KeySegmentRun = "run";
    private const string KeySegmentCompare = "compare";

    public static string Build(CompositeAlertRule rule, AlertEvaluationContext context)
    {
        ArgumentNullException.ThrowIfNull(rule);
        ArgumentNullException.ThrowIfNull(context);

        return rule.DedupeScope switch
        {
            CompositeDedupeScope.RuleOnly =>
                $"{KeyPrefixComposite}:{rule.CompositeRuleId}",
            CompositeDedupeScope.RuleAndRun =>
                $"{KeyPrefixComposite}:{rule.CompositeRuleId}:{KeySegmentRun}:{context.RunId}",
            CompositeDedupeScope.RuleAndComparison =>
                $"{KeyPrefixComposite}:{rule.CompositeRuleId}:{KeySegmentRun}:{context.RunId}:{KeySegmentCompare}:{context.ComparedToRunId}",
            _ => $"{KeyPrefixComposite}:{rule.CompositeRuleId}:{KeySegmentRun}:{context.RunId}"
        };
    }
}
