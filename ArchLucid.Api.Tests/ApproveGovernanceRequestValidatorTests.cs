using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApproveGovernanceRequestValidatorTests
{
    private readonly ApproveGovernanceRequestValidator _validator = new();

    [Fact]
    public void Validate_passes_when_reviewed_by_omitted_because_controller_uses_actor_context()
    {
        ApproveGovernanceRequest request = new() { ReviewComment = "ok" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(200, 4000, null)]
    [InlineData(201, 4000, nameof(ApproveGovernanceRequest.ReviewedBy))]
    [InlineData(200, 4001, nameof(ApproveGovernanceRequest.ReviewComment))]
    public void Validate_enforces_each_field_length_at_its_boundary(
        int reviewedByLength,
        int commentLength,
        string? invalidProperty)
    {
        ApproveGovernanceRequest request = new()
        {
            ReviewedBy = new string('r', reviewedByLength),
            ReviewComment = new string('c', commentLength),
        };

        ValidationResult result = _validator.Validate(request);

        if (invalidProperty is null)
            result.IsValid.Should().BeTrue();
        else
            result.Errors.Should().ContainSingle().Which.PropertyName.Should().Be(invalidProperty);
    }

    [Fact]
    public void Validate_passes_for_minimal_valid_request()
    {
        ApproveGovernanceRequest request = new() { ReviewedBy = "reviewer@contoso.test" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
