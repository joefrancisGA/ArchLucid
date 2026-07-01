using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RejectGovernanceRequestValidatorTests
{
    private readonly RejectGovernanceRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_reviewed_by_missing()
    {
        RejectGovernanceRequest request = new() { ReviewedBy = string.Empty };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_passes_for_valid_request()
    {
        RejectGovernanceRequest request = new()
        {
            ReviewedBy = "reviewer@contoso.test",
            ReviewComment = "Needs changes"
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
