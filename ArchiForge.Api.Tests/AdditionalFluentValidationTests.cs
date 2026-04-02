using ArchiForge.Api.Models;
using ArchiForge.Api.Validators;
using ArchiForge.Contracts.Agents;
using ArchiForge.Decisioning.Advisory.Workflow;
using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;
using ArchiForge.Decisioning.Alerts.Simulation;
using ArchiForge.Decisioning.Alerts.Tuning;

using FluentAssertions;

namespace ArchiForge.Api.Tests;

public sealed class AdditionalFluentValidationTests
{
    [Fact]
    public void CompositeAlertRuleBodyValidator_invalid_when_conditions_empty()
    {
        CompositeAlertRuleBodyValidator v = new();
        CompositeAlertRule rule = new()
        {
            Name = "n",
            Severity = "Warning",
            Operator = CompositeOperator.And,
            Conditions = [],
        };

        FluentValidation.Results.ValidationResult r = v.Validate(rule);

        r.IsValid.Should().BeFalse();
        r.Errors.Should().Contain(e => e.ErrorMessage.Contains("condition", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CompositeAlertRuleBodyValidator_valid_when_minimal_rule()
    {
        CompositeAlertRuleBodyValidator v = new();
        CompositeAlertRule rule = new()
        {
            Name = "n",
            Severity = "Warning",
            Operator = CompositeOperator.And,
            Conditions =
            [
                new AlertRuleCondition
                {
                    MetricType = "m",
                    Operator = AlertConditionOperator.GreaterThan,
                    ThresholdValue = 1,
                },
            ],
        };

        FluentValidation.Results.ValidationResult r = v.Validate(rule);

        r.IsValid.Should().BeTrue();
    }

    [Fact]
    public void RecommendationActionRequestValidator_invalid_action_length()
    {
        RecommendationActionRequestValidator v = new();
        RecommendationActionRequest req = new() { Action = new string('x', 51) };

        FluentValidation.Results.ValidationResult r = v.Validate(req);

        r.IsValid.Should().BeFalse();
    }

    [Fact]
    public void RuleCandidateComparisonRequestValidator_simple_requires_both_candidates()
    {
        RuleCandidateComparisonRequestValidator v = new();
        RuleCandidateComparisonRequest req = new()
        {
            RuleKind = "Simple",
            CandidateASimpleRule = new AlertRule { Name = "a", RuleType = AlertRuleType.CostIncreasePercent },
            CandidateBSimpleRule = null,
        };

        FluentValidation.Results.ValidationResult r = v.Validate(req);

        r.IsValid.Should().BeFalse();
    }

    [Fact]
    public void RuleSimulationRequestValidator_invalid_kind()
    {
        RuleSimulationRequestValidator v = new();
        RuleSimulationRequest req = new() { RuleKind = "Other" };

        FluentValidation.Results.ValidationResult r = v.Validate(req);

        r.IsValid.Should().BeFalse();
    }

    [Fact]
    public void SubmitAgentResultRequestValidator_invalid_confidence()
    {
        SubmitAgentResultRequestValidator v = new();
        SubmitAgentResultRequest req = new()
        {
            Result = new AgentResult
            {
                ResultId = "r",
                RunId = "run",
                TaskId = "t",
                Confidence = 2,
                Claims = [],
                EvidenceRefs = [],
            },
        };

        FluentValidation.Results.ValidationResult r = v.Validate(req);

        r.IsValid.Should().BeFalse();
    }

    [Fact]
    public void ThresholdRecommendationRequestValidator_requires_positive_recent_run_count()
    {
        ThresholdRecommendationRequestValidator v = new();
        ThresholdRecommendationRequest req = new()
        {
            RuleKind = "Simple",
            TunedMetricType = "m",
            CandidateThresholds = [1],
            RecentRunCount = 0,
        };

        FluentValidation.Results.ValidationResult r = v.Validate(req);

        r.IsValid.Should().BeFalse();
    }
}
