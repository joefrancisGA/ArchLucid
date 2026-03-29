using ArchiForge.Api.Validators;
using ArchiForge.Decisioning.Alerts;

using FluentAssertions;

namespace ArchiForge.Api.Tests;

/// <summary>
/// Tests for Alert Rule Body Validator.
/// </summary>

[Trait("Category", "Unit")]
public sealed class AlertRuleBodyValidatorTests
{
    private readonly AlertRuleBodyValidator _validator = new();

    [Fact]
    public void Validate_Fails_WhenNameEmpty()
    {
        AlertRule rule = new()
        {
            Name = "",
            RuleType = "FindingCount",
            Severity = "Warning"
        };

        FluentValidation.Results.ValidationResult result = _validator.Validate(rule);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(AlertRule.Name));
    }

    [Fact]
    public void Validate_Succeeds_WhenRequiredFieldsPresent()
    {
        AlertRule rule = new()
        {
            Name = "n",
            RuleType = "FindingCount",
            Severity = "Warning"
        };

        FluentValidation.Results.ValidationResult result = _validator.Validate(rule);

        result.IsValid.Should().BeTrue();
    }
}
