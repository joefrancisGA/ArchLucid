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
    [InlineData("unknown")]
    [InlineData("2147483647")]
    [InlineData("-2147483648")]
    public void Parse_rejects_missing_or_corrupt_status(string? raw)
    {
        Action act = () => ArtifactBundleStatusParser.Parse(raw);
        act.Should().Throw<ArgumentException>();
    }
}
