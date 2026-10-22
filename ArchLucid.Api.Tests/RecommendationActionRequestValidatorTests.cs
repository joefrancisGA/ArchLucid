using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Advisory.Workflow;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RecommendationActionRequestValidatorTests
{
    private readonly RecommendationActionRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_action_is_empty()
    {
        RecommendationActionRequest request = new() { Action = "" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Action is required"));
    }

    [Fact]
    public void Validate_fails_when_action_exceeds_max_length()
    {
        RecommendationActionRequest request = new() { Action = new string('a', 51) };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("50 characters"));
    }

    [Fact]
    public void Validate_fails_when_comment_exceeds_max_length()
    {
        RecommendationActionRequest request = new() { Action = "accept", Comment = new string('c', 2001) };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Comment must not exceed"));
    }

    [Fact]
    public void Validate_fails_when_rationale_exceeds_max_length()
    {
        RecommendationActionRequest request = new() { Action = "accept", Rationale = new string('r', 2001) };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Rationale must not exceed"));
    }

    [Fact]
    public void Validate_passes_when_comment_and_rationale_are_null()
    {
        RecommendationActionRequest request = new() { Action = "accept", Comment = null, Rationale = null };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_passes_for_well_formed_request()
    {
        RecommendationActionRequest request = new()
        {
            Action = "accept",
            Comment = "Looks good",
            Rationale = "Low risk",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
