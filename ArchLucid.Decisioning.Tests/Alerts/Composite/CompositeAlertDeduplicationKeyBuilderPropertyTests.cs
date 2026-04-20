using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;

using FluentAssertions;

using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.Alerts.Composite;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CompositeAlertDeduplicationKeyBuilderPropertyTests
{
    [Property(MaxTest = 120)]
    public void Build_is_deterministic_and_includes_rule_id_for_all_scopes(Guid ruleGuid, Guid? runId, Guid? comparedToRunId)
    {
        Guid ruleId = ruleGuid;

        foreach (string dedupeScope in new[]
                 {
                     CompositeDedupeScope.RuleOnly,
                     CompositeDedupeScope.RuleAndRun,
                     CompositeDedupeScope.RuleAndComparison,
                 })
        {
            CompositeAlertRule rule = new()
            {
                CompositeRuleId = ruleId,
                DedupeScope = dedupeScope
            };
            AlertEvaluationContext context = new()
            {
                RunId = runId,
                ComparedToRunId = comparedToRunId,
            };

            string first = CompositeAlertDeduplicationKeyBuilder.Build(rule, context);
            string second = CompositeAlertDeduplicationKeyBuilder.Build(rule, context);

            first.Should().Be(second);
            first.Should().Contain(ruleId.ToString());
        }
    }

    [Property(MaxTest = 80)]
    public void RuleOnly_keys_exclude_run_segment_even_when_run_id_is_set(Guid ruleGuid, Guid runId)
    {
        Guid ruleId = ruleGuid;
        CompositeAlertRule rule = new()
        {
            CompositeRuleId = ruleId,
            DedupeScope = CompositeDedupeScope.RuleOnly
        };
        AlertEvaluationContext context = new()
        {
            RunId = runId,
            ComparedToRunId = Guid.NewGuid()
        };

        string key = CompositeAlertDeduplicationKeyBuilder.Build(rule, context);
        string runSegment = ":run:" + runId;

        key.Should().NotContain(runSegment);
    }

    [Property(MaxTest = 80)]
    public void RuleAndRun_keys_include_run_id_when_set(Guid ruleGuid, Guid runId)
    {
        Guid ruleId = ruleGuid;
        CompositeAlertRule rule = new()
        {
            CompositeRuleId = ruleId,
            DedupeScope = CompositeDedupeScope.RuleAndRun
        };
        AlertEvaluationContext context = new()
        {
            RunId = runId,
            ComparedToRunId = null
        };

        string key = CompositeAlertDeduplicationKeyBuilder.Build(rule, context);

        key.Should().Contain(runId.ToString());
    }
}
