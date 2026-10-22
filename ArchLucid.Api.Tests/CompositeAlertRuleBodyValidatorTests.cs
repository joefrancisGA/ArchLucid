using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Alerts.Composite;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CompositeAlertRuleBodyValidatorTests
{
    private readonly CompositeAlertRuleBodyValidator _validator = new();

    private static CompositeAlertRule ValidRule() => new()
    {
        Name = "High risk spike",
        Severity = "High",
        Operator = "And",
        Conditions = [new AlertRuleCondition { MetricType = "cost", Operator = "gte", ThresholdValue = 1 }],
    };

    [Fact]
    public void Validate_fails_when_name_is_empty()
    {
        CompositeAlertRule rule = ValidRule();
        rule.Name = "";

        ValidationResult result = _validator.Validate(rule);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void Validate_fails_when_severity_is_empty()
    {
        CompositeAlertRule rule = ValidRule();
        rule.Severity = "";

        ValidationResult result = _validator.Validate(rule);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Severity");
    }

    [Fact]
    public void Validate_fails_when_operator_is_empty()
    {
        CompositeAlertRule rule = ValidRule();
        rule.Operator = "";

        ValidationResult result = _validator.Validate(rule);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Operator");
    }

    [Fact]
    public void Validate_fails_when_conditions_is_empty()
    {
        CompositeAlertRule rule = ValidRule();
        rule.Conditions = [];

        ValidationResult result = _validator.Validate(rule);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("At least one condition is required"));
    }

    [Fact]
    public void Validate_passes_for_well_formed_rule()
    {
        ValidationResult result = _validator.Validate(ValidRule());

        result.IsValid.Should().BeTrue();
    }
}
