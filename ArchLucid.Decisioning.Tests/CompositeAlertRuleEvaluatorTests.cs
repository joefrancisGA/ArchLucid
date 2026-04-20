using ArchLucid.Decisioning.Alerts.Composite;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Unit tests for <see cref="CompositeAlertRuleEvaluator"/>:
/// empty-conditions guard, AND/OR reduction, all six condition operators,
/// and the unknown-metric-type fallback to 0.
/// </summary>
[Trait("Category", "Unit")]
public sealed class CompositeAlertRuleEvaluatorTests
{
    private readonly CompositeAlertRuleEvaluator _sut = new();

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static CompositeAlertRule MakeRule(
        string @operator,
        params AlertRuleCondition[] conditions) => new()
        {
            CompositeRuleId = Guid.NewGuid(),
            Name = "test-rule",
            Operator = @operator,
            Conditions = conditions.ToList()
        };

    private static AlertRuleCondition Condition(
        string metricType,
        string conditionOperator,
        decimal threshold) => new()
        {
            MetricType = metricType,
            Operator = conditionOperator,
            ThresholdValue = threshold
        };

    private static AlertMetricSnapshot Snapshot(decimal criticalCount = 0,
        decimal complianceGaps = 0,
        decimal costPct = 0,
        decimal deferredHigh = 0,
        decimal rejectedSecurity = 0,
        decimal acceptanceRate = 0) => new()
        {
            CriticalRecommendationCount = criticalCount,
            NewComplianceGapCount = complianceGaps,
            CostIncreasePercent = costPct,
            DeferredHighPriorityRecommendationCount = deferredHigh,
            RejectedSecurityRecommendationCount = rejectedSecurity,
            AcceptanceRatePercent = acceptanceRate
        };

    // ──────────────────────────────────────────────────────────────────────────
    // Empty conditions
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Evaluate_EmptyConditions_ReturnsFalse()
    {
        CompositeAlertRule rule = MakeRule(CompositeOperator.And);
        bool result = _sut.Evaluate(rule, Snapshot());

        result.Should().BeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Unknown operator
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Evaluate_UnknownOperator_ReturnsFalse()
    {
        CompositeAlertRule rule = MakeRule(
            "Xor",
            Condition(AlertMetricType.CriticalRecommendationCount, AlertConditionOperator.GreaterThanOrEqual, 1));

        bool result = _sut.Evaluate(rule, Snapshot(criticalCount: 5));

        result.Should().BeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AND operator
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Evaluate_And_AllConditionsPass_ReturnsTrue()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.CriticalRecommendationCount, AlertConditionOperator.GreaterThanOrEqual, 2),
            Condition(AlertMetricType.NewComplianceGapCount, AlertConditionOperator.GreaterThan, 0));

        bool result = _sut.Evaluate(rule, Snapshot(criticalCount: 3, complianceGaps: 1));

        result.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_And_OneConditionFails_ReturnsFalse()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.CriticalRecommendationCount, AlertConditionOperator.GreaterThanOrEqual, 2),
            Condition(AlertMetricType.NewComplianceGapCount, AlertConditionOperator.GreaterThan, 5));

        // criticalCount passes (3 >= 2), but complianceGaps fails (1 <= 5)
        bool result = _sut.Evaluate(rule, Snapshot(criticalCount: 3, complianceGaps: 1));

        result.Should().BeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OR operator
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Evaluate_Or_AnyConditionPasses_ReturnsTrue()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.Or,
            Condition(AlertMetricType.CriticalRecommendationCount, AlertConditionOperator.GreaterThanOrEqual, 10),
            Condition(AlertMetricType.NewComplianceGapCount, AlertConditionOperator.GreaterThan, 0));

        // criticalCount fails (3 < 10), complianceGaps passes (1 > 0)
        bool result = _sut.Evaluate(rule, Snapshot(criticalCount: 3, complianceGaps: 1));

        result.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_Or_AllConditionsFail_ReturnsFalse()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.Or,
            Condition(AlertMetricType.CriticalRecommendationCount, AlertConditionOperator.GreaterThanOrEqual, 10),
            Condition(AlertMetricType.NewComplianceGapCount, AlertConditionOperator.GreaterThan, 5));

        bool result = _sut.Evaluate(rule, Snapshot(criticalCount: 3, complianceGaps: 1));

        result.Should().BeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Six condition operators — exercised at the boundary
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Evaluate_GreaterThanOrEqual_AtBoundary_ReturnsTrue()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.CriticalRecommendationCount, AlertConditionOperator.GreaterThanOrEqual, 3));

        _sut.Evaluate(rule, Snapshot(criticalCount: 3)).Should().BeTrue();
        _sut.Evaluate(rule, Snapshot(criticalCount: 2)).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_GreaterThan_AtBoundary_ReturnsFalse()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.CriticalRecommendationCount, AlertConditionOperator.GreaterThan, 3));

        _sut.Evaluate(rule, Snapshot(criticalCount: 3)).Should().BeFalse();
        _sut.Evaluate(rule, Snapshot(criticalCount: 4)).Should().BeTrue();
    }

    [Fact]
    public void Evaluate_LessThanOrEqual_AtBoundary_ReturnsTrue()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.AcceptanceRatePercent, AlertConditionOperator.LessThanOrEqual, 50));

        _sut.Evaluate(rule, Snapshot(acceptanceRate: 50)).Should().BeTrue();
        _sut.Evaluate(rule, Snapshot(acceptanceRate: 51)).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_LessThan_AtBoundary_ReturnsFalse()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.AcceptanceRatePercent, AlertConditionOperator.LessThan, 50));

        _sut.Evaluate(rule, Snapshot(acceptanceRate: 50)).Should().BeFalse();
        _sut.Evaluate(rule, Snapshot(acceptanceRate: 49)).Should().BeTrue();
    }

    [Fact]
    public void Evaluate_Equal_ExactMatch_ReturnsTrue()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.NewComplianceGapCount, AlertConditionOperator.Equal, 4));

        _sut.Evaluate(rule, Snapshot(complianceGaps: 4)).Should().BeTrue();
        _sut.Evaluate(rule, Snapshot(complianceGaps: 5)).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NotEqual_DifferentValue_ReturnsTrue()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition(AlertMetricType.NewComplianceGapCount, AlertConditionOperator.NotEqual, 0));

        _sut.Evaluate(rule, Snapshot(complianceGaps: 1)).Should().BeTrue();
        _sut.Evaluate(rule, Snapshot(complianceGaps: 0)).Should().BeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Unknown metric type resolves to 0
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Evaluate_UnknownMetricType_ResolvesToZero()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition("UnknownMetric", AlertConditionOperator.GreaterThanOrEqual, 1));

        // 0 >= 1 is false
        _sut.Evaluate(rule, Snapshot()).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_UnknownMetricType_ZeroThreshold_Equal_ReturnsTrue()
    {
        CompositeAlertRule rule = MakeRule(
            CompositeOperator.And,
            Condition("UnknownMetric", AlertConditionOperator.Equal, 0));

        // unknown resolves to 0, 0 == 0 is true
        _sut.Evaluate(rule, Snapshot()).Should().BeTrue();
    }
}
