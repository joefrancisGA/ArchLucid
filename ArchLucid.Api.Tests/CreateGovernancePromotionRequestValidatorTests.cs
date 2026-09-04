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
    public void Validate_passes_when_promoted_by_omitted_because_controller_uses_actor_context()
    {
        CreateGovernancePromotionRequest request = new()
        {
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ManifestVersion = "1.0.0",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Test,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
