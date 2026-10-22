using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Contracts.Alerts.Simulation;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RuleCandidateComparisonRequestValidatorTests
{
    private readonly RuleCandidateComparisonRequestValidator _validator = new();

    [Fact]
    public void Simple_kind_requires_both_simple_candidates()
    {
        RuleCandidateComparisonRequest request = new()
        {
            RuleKind = "Simple",
            CandidateASimpleRule = new AlertRule(),
            CandidateBSimpleRule = null,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("CandidateBSimpleRule", StringComparison.Ordinal));
    }

    [Fact]
    public void Simple_kind_passes_when_both_candidates_present()
    {
        RuleCandidateComparisonRequest request = new()
        {
            RuleKind = "Simple",
            CandidateASimpleRule = new AlertRule(),
            CandidateBSimpleRule = new AlertRule(),
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Composite_kind_requires_both_composite_candidates()
    {
        RuleCandidateComparisonRequest request = new()
        {
            RuleKind = "Composite",
            CandidateACompositeRule = new CompositeAlertRule(),
            CandidateBCompositeRule = null,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("CandidateBCompositeRule", StringComparison.Ordinal));
    }

    [Fact]
    public void Composite_kind_passes_when_both_candidates_present()
    {
        RuleCandidateComparisonRequest request = new()
        {
            RuleKind = "Composite",
            CandidateACompositeRule = new CompositeAlertRule(),
            CandidateBCompositeRule = new CompositeAlertRule(),
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
