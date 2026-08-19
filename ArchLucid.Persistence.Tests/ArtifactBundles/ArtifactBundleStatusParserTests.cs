using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Persistence.ArtifactBundles;

namespace ArchLucid.Persistence.Tests.ArtifactBundles;

[Trait("Category", "Unit")]
public sealed class ArtifactBundleStatusParserTests
{
    [Theory]
    [InlineData("Pending", ArtifactBundleStatus.Pending)]
    [InlineData("PENDING", ArtifactBundleStatus.Pending)]
    [InlineData(" Available ", ArtifactBundleStatus.Available)]
    public void Parse_returns_enum_when_valid(string raw, ArtifactBundleStatus expected)
    {
        ArtifactBundleStatus actual = ArtifactBundleStatusParser.Parse(raw);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not_a_known_status")]
    public void Parse_defaults_to_available_when_invalid_or_missing(string? raw)
    {
        ArtifactBundleStatus actual = ArtifactBundleStatusParser.Parse(raw);

        actual.Should().Be(ArtifactBundleStatus.Available);
    }
}
