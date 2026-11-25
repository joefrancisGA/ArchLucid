using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CreateGovernanceApprovalRequestValidatorTests
{
    private readonly CreateGovernanceApprovalRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_environments_are_identical()
    {
        CreateGovernanceApprovalRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Dev
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_passes_for_dev_to_test_promotion()
    {
        CreateGovernanceApprovalRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Test
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(64, 64, null)]
    [InlineData(65, 64, nameof(CreateGovernanceApprovalRequest.SourceEnvironment))]
    [InlineData(64, 65, nameof(CreateGovernanceApprovalRequest.TargetEnvironment))]
    public void Validate_checks_custom_environment_slug_length_boundary(
        int sourceLength, int targetLength, string? invalidProperty)
    {
        CreateGovernanceApprovalRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "v1",
            SourceEnvironment = new string('a', sourceLength),
            TargetEnvironment = new string('b', targetLength),
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().Be(invalidProperty is null);
        if (invalidProperty is not null)
        {
            ValidationFailure failure = Assert.Single(result.Errors);
            Assert.Equal(invalidProperty, failure.PropertyName);
            Assert.Contains("64 characters", failure.ErrorMessage);
        }
    }

    [Fact]
    public void Validate_passes_for_custom_environment_slugs()
    {
        CreateGovernanceApprovalRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "v1",
            SourceEnvironment = "draft",
            TargetEnvironment = "approved",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
