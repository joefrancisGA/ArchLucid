using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReplayComparisonRequestValidatorTests
{
    private readonly ReplayComparisonRequestValidator _validator = new();

    [Fact]
    public void Valid_defaults_pass()
    {
        ReplayComparisonRequest request = new();

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Invalid_format_fails()
    {
        ReplayComparisonRequest request = new() { Format = "pdf" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Invalid_replay_mode_fails()
    {
        ReplayComparisonRequest request = new() { ReplayMode = "unknown" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Invalid_profile_when_set_fails()
    {
        ReplayComparisonRequest request = new() { Profile = "verbose" };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("default")]
    [InlineData("sponsor")]
    public void Valid_profile_passes(string profile)
    {
        ReplayComparisonRequest request = new() { Profile = profile };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
