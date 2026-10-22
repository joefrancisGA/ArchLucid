using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CreateGovernancePreviewRequestValidatorTests
{
    private readonly CreateGovernancePreviewRequestValidator _validator = new();

    [Fact]
    public void Valid_request_passes()
    {
        CreateGovernancePreviewRequest request = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            ManifestVersion = "1.0.0",
            Environment = "dev",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("staging")]
    [InlineData("")]
    public void Invalid_environment_fails(string environment)
    {
        CreateGovernancePreviewRequest request = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            ManifestVersion = "1.0.0",
            Environment = environment,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Missing_manifest_version_fails()
    {
        CreateGovernancePreviewRequest request = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            ManifestVersion = "",
            Environment = "prod",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
