using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Alerts.Simulation;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RuleSimulationRequestValidatorTests
{
    private readonly RuleSimulationRequestValidator _validator = new();

    [Theory]
    [InlineData("Simple")]
    [InlineData("simple")]
    [InlineData("Composite")]
    [InlineData("COMPOSITE")]
    public void Valid_rule_kind_passes(string ruleKind)
    {
        RuleSimulationRequest request = new() { RuleKind = ruleKind };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("Hybrid")]
    public void Invalid_rule_kind_fails(string ruleKind)
    {
        RuleSimulationRequest request = new() { RuleKind = ruleKind };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Simple", StringComparison.OrdinalIgnoreCase));
    }
}
