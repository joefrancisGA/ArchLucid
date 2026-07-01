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

    [Fact]
    public void Validate_fails_when_skipping_environment_order()
    {
        CreateGovernanceApprovalRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Prod
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
