using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class ArchitectureRequestFieldLimitsValidatorTests
{
    private static ArchitectureRequest BuildMinimalRequest(string description)
    {
        return new ArchitectureRequest
        {
            Description = description,
            SystemName = "TargetSystem",
            Environment = "staging",
            CloudProvider = CloudProvider.Azure,
        };
    }

    [Fact]
    public async Task Description_at_max_length_passes_validation()
    {
        string description = new string('a', ArchitectureRequestFieldLimits.MaxDescriptionLength);
        ArchitectureRequestValidator validator = new();

        ValidationResult result = await validator.ValidateAsync(BuildMinimalRequest(description));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Description_over_max_length_fails_validation()
    {
        string description = new string('a', ArchitectureRequestFieldLimits.MaxDescriptionLength + 1);
        ArchitectureRequestValidator validator = new();

        ValidationResult result = await validator.ValidateAsync(BuildMinimalRequest(description));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(ArchitectureRequest.Description)
            && e.ErrorMessage.Contains(
                ArchitectureRequestFieldLimits.MaxDescriptionLength.ToString(),
                StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(CloudProvider.Aws)]
    [InlineData(CloudProvider.Gcp)]
    public async Task Aws_and_Gcp_cloud_providers_pass_validation(CloudProvider cloudProvider)
    {
        ArchitectureRequest request = BuildMinimalRequest(new string('a', ArchitectureRequestFieldLimits.MinDescriptionLength));
        request.CloudProvider = cloudProvider;

        ArchitectureRequestValidator validator = new();
        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task InlineRequirement_over_max_length_fails_validation()
    {
        ArchitectureRequest request = BuildMinimalRequest(new string('a', ArchitectureRequestFieldLimits.MinDescriptionLength));
        request.InlineRequirements = [new string('b', ArchitectureRequestFieldLimits.MaxInlineRequirementLength + 1)];

        ArchitectureRequestValidator validator = new();
        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.ErrorMessage.Contains(
                ArchitectureRequestFieldLimits.MaxInlineRequirementLength.ToString(),
                StringComparison.Ordinal));
    }
}
