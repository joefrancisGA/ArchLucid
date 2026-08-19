using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class EndToEndComparisonExportProfileTests
{
    [Theory]
    [InlineData(null, EndToEndComparisonExportProfile.Default)]
    [InlineData("  SPONSOR ", "sponsor")]
    public void Normalize_trims_and_defaults(string? profile, string expected)
    {
        EndToEndComparisonExportProfile.Normalize(profile).Should().Be(expected);
    }

    [Theory]
    [InlineData(EndToEndComparisonExportProfile.Short, true)]
    [InlineData("SHORT", true)]
    [InlineData(EndToEndComparisonExportProfile.Detailed, false)]
    public void IsShort_detects_short_profile(string profile, bool expected)
    {
        EndToEndComparisonExportProfile.IsShort(profile).Should().Be(expected);
    }

    [Theory]
    [InlineData(EndToEndComparisonExportProfile.Sponsor, true)]
    [InlineData(EndToEndComparisonExportProfile.Default, false)]
    public void IsExecutive_detects_executive_profile(string profile, bool expected)
    {
        EndToEndComparisonExportProfile.IsExecutive(profile).Should().Be(expected);
    }

    [Theory]
    [InlineData(null, true)]
    [InlineData(EndToEndComparisonExportProfile.Default, true)]
    [InlineData(EndToEndComparisonExportProfile.Detailed, true)]
    [InlineData(EndToEndComparisonExportProfile.Short, false)]
    public void IsDetailedOrDefault(string? profile, bool expected)
    {
        EndToEndComparisonExportProfile.IsDetailedOrDefault(profile).Should().Be(expected);
    }
}
