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

    [Fact]
    public void Validate_fails_when_reviewed_by_exceeds_max_length()
    {
        ApproveGovernanceRequest request = new() { ReviewedBy = new string('r', 201), ReviewComment = "ok" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_passes_for_minimal_valid_request()
    {
        ApproveGovernanceRequest request = new() { ReviewedBy = "reviewer@contoso.test" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
