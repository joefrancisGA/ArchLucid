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
    public void Validate_passes_for_custom_environment_slugs_up_to_sixty_four_characters()
    {
        string sourceSlug = "staging-" + new string('a', 32);
        string targetSlug = "approved-" + new string('b', 31);

        CreateGovernanceApprovalRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "v1",
            SourceEnvironment = sourceSlug,
            TargetEnvironment = targetSlug,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
        sourceSlug.Length.Should().Be(40);
        targetSlug.Length.Should().Be(40);
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
