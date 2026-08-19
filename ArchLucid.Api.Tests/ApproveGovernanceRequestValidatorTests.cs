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
    public void Validate_fails_when_reviewed_by_missing()
    {
        ApproveGovernanceRequest request = new() { ReviewedBy = "", ReviewComment = "ok" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ApproveGovernanceRequest.ReviewedBy));
    }

    [Fact]
    public void Validate_passes_for_minimal_valid_request()
    {
        ApproveGovernanceRequest request = new() { ReviewedBy = "reviewer@contoso.test" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
