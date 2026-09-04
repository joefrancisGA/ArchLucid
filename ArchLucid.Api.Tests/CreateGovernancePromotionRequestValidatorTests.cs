using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CreateGovernancePromotionRequestValidatorTests
{
    private readonly CreateGovernancePromotionRequestValidator _validator = new();

    [Fact]
    public void Validate_accepts_property_initializer_defaults_for_standard_dev_to_test_promotion()
    {
        CreateGovernancePromotionRequest request = new()
        {
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ManifestVersion = "1.0.0",
        };

        request.SourceEnvironment.Should().Be(GovernanceEnvironment.Dev);
        request.TargetEnvironment.Should().Be(GovernanceEnvironment.Test);

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
