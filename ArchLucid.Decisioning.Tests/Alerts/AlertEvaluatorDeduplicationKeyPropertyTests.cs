using ArchLucid.Core.Comparison;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Alerts;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.Alerts;

/// <summary>
/// Property tests for stable <see cref="AlertRecord.DeduplicationKey"/> shapes produced by
/// <see cref="AlertEvaluator"/> (simple alert dedupe contract per ADR 0008).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AlertEvaluatorDeduplicationKeyPropertyTests
{
    private static readonly AlertEvaluator Evaluator = new();

    private static Gen<(int Threshold, int Count)> ThresholdAndMatchingCountGen() =>
        Gen.Choose(1, 25).SelectMany(t => Gen.Choose(t, t + 20).Select(c => (t, c)));

    [Property(MaxTest = 150)]
    public Property CriticalRecommendationCount_deduplication_key_uses_rule_id_and_count()
    {
        Arbitrary<(int Threshold, int Count)> pairArb = Arb.From(ThresholdAndMatchingCountGen());

        return Prop.ForAll(pairArb, pair =>
        {
            (int threshold, int count) = pair;
            Guid ruleId = Guid.NewGuid();

            AlertRule rule = new()
            {
                RuleId = ruleId,
                Name = "prop-critical-rec",
                RuleType = AlertRuleType.CriticalRecommendationCount,
                ThresholdValue = threshold,
                IsEnabled = true,
                Severity = AlertSeverity.Warning,
            };

            List<ImprovementRecommendation> recommendations = Enumerable
                .Range(0, count)
                .Select(_ => new ImprovementRecommendation { Urgency = AlertUrgencies.Critical })
                .ToList();

            AlertEvaluationContext context = new()
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                ImprovementPlan = new ImprovementPlan { Recommendations = recommendations },
            };

            IReadOnlyList<AlertRecord> alerts = Evaluator.Evaluate([rule], context);

            if (alerts.Count != 1)
            {
                return false;
            }

            string expectedKey = $"{ruleId}:critical-rec-count:{count}";

            return alerts[0].DeduplicationKey == expectedKey;
        });
    }

    [Property(MaxTest = 120)]
    public Property NewComplianceGapCount_deduplication_key_uses_rule_id_and_count()
    {
        Arbitrary<(int Threshold, int Count)> pairArb = Arb.From(ThresholdAndMatchingCountGen());

        return Prop.ForAll(pairArb, pair =>
        {
            (int threshold, int count) = pair;
            Guid ruleId = Guid.NewGuid();

            AlertRule rule = new()
            {
                RuleId = ruleId,
                Name = "prop-comp-gap",
                RuleType = AlertRuleType.NewComplianceGapCount,
                ThresholdValue = threshold,
                IsEnabled = true,
                Severity = AlertSeverity.Warning,
            };

            List<SecurityDelta> securityChanges = Enumerable
                .Range(0, count)
                .Select(i => new SecurityDelta
                {
                    ControlName = $"ctrl-{i}",
                    BaseStatus = "Uncovered",
                    TargetStatus = "Covered",
                })
                .ToList();

            AlertEvaluationContext context = new()
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                ComparisonResult = new ComparisonResult { SecurityChanges = securityChanges },
            };

            IReadOnlyList<AlertRecord> alerts = Evaluator.Evaluate([rule], context);

            if (alerts.Count != 1)
            {
                return false;
            }

            string expectedKey = $"{ruleId}:comp-gap-count:{count}";

            return alerts[0].DeduplicationKey == expectedKey;
        });
    }
}
