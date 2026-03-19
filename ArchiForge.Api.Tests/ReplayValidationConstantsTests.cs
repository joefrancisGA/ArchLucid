using ArchiForge.Api.Validators;
using FluentAssertions;

namespace ArchiForge.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ReplayValidationConstantsTests
{
    [Fact]
    public void ValidFormats_contains_expected_values_and_count()
    {
        var expected = new[] { "markdown", "html", "docx", "json" };
        ReplayValidationConstants.ValidFormats.Should().HaveCount(expected.Length);
        foreach (var e in expected)
            ReplayValidationConstants.ValidFormats.Should().Contain(e);
    }

    [Fact]
    public void ValidReplayModes_contains_expected_values_and_count()
    {
        var expected = new[] { "artifact", "regenerate", "verify" };
        ReplayValidationConstants.ValidReplayModes.Should().HaveCount(expected.Length);
        foreach (var e in expected)
            ReplayValidationConstants.ValidReplayModes.Should().Contain(e);
    }

    [Fact]
    public void ValidProfiles_contains_expected_values_and_count()
    {
        var expected = new[] { "default", "short", "detailed", "executive" };
        ReplayValidationConstants.ValidProfiles.Should().HaveCount(expected.Length);
        foreach (var e in expected)
            ReplayValidationConstants.ValidProfiles.Should().Contain(e);
    }

    [Fact]
    public void ValidFormats_is_case_insensitive_for_lookup()
    {
        ReplayValidationConstants.ValidFormats.Should().Contain("MARKDOWN");
        ReplayValidationConstants.ValidFormats.Should().Contain("DocX");
    }
}
