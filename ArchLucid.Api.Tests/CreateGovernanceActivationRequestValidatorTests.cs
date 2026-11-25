using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CreateGovernanceActivationRequestValidatorTests
{
    private readonly CreateGovernanceActivationRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_run_id_is_empty()
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = "",
            ManifestVersion = "1.0.0",
            Environment = "dev",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("RunId is required"));
    }

    [Theory]
    [InlineData(64, true)]
    [InlineData(65, false)]
    public void Validate_checks_run_id_length_boundary(int length, bool valid)
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = new string('r', length),
            ManifestVersion = "1.0.0",
            Environment = "dev",
        };

        ValidationResult result = _validator.Validate(request);

        AssertLengthResult(result, valid, nameof(request.RunId), "64 characters");
    }

    [Fact]
    public void Validate_fails_when_manifest_version_is_empty()
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "",
            Environment = "dev",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("ManifestVersion is required"));
    }

    [Theory]
    [InlineData(128, true)]
    [InlineData(129, false)]
    public void Validate_checks_manifest_version_length_boundary(int length, bool valid)
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = new string('m', length),
            Environment = "dev",
        };

        ValidationResult result = _validator.Validate(request);

        AssertLengthResult(result, valid, nameof(request.ManifestVersion), "128 characters");
    }

    [Fact]
    public void Validate_fails_when_environment_is_empty()
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "1.0.0",
            Environment = "",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Environment is required"));
    }

    [Fact]
    public void Validate_fails_when_environment_is_unrecognized()
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "1.0.0",
            Environment = "staging",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("dev, test, prod"));
    }

    [Theory]
    [InlineData("dev")]
    [InlineData("Test")]
    [InlineData("PROD")]
    public void Validate_passes_for_known_environments_regardless_of_case(string environment)
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "1.0.0",
            Environment = environment,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_accepts_property_initializer_default_environment_for_standard_dev_activation()
    {
        CreateGovernanceActivationRequest request = new()
        {
            RunId = "run-1",
            ManifestVersion = "1.0.0",
        };

        request.Environment.Should().Be("dev");

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    private static void AssertLengthResult(ValidationResult result, bool valid, string property, string messageFragment)
    {
        result.IsValid.Should().Be(valid);
        if (!valid)
        {
            ValidationFailure failure = Assert.Single(result.Errors);
            Assert.Equal(property, failure.PropertyName);
            Assert.Contains(messageFragment, failure.ErrorMessage);
        }
    }
}
