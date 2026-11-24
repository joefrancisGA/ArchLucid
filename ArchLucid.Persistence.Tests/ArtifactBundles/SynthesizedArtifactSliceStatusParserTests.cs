using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Persistence.ArtifactBundles;

namespace ArchLucid.Persistence.Tests.ArtifactBundles;

[Trait("Category", "Unit")]
public sealed class SynthesizedArtifactSliceStatusParserTests
{
    [Theory]
    [InlineData("Pending", SynthesizedArtifactGenerationStatus.Pending)]
    [InlineData("GENERATED", SynthesizedArtifactGenerationStatus.Generated)]
    public void Parse_returns_enum_when_valid(string raw, SynthesizedArtifactGenerationStatus expected)
    {
        SynthesizedArtifactGenerationStatus actual = SynthesizedArtifactSliceStatusParser.Parse(raw);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Parse_defaults_to_generated_when_missing(string? raw)
    {
        SynthesizedArtifactGenerationStatus actual = SynthesizedArtifactSliceStatusParser.Parse(raw);

        actual.Should().Be(SynthesizedArtifactGenerationStatus.Generated);
    }

    [Theory]
    [InlineData("unknown")]
    [InlineData("2147483647")]
    [InlineData("-2147483648")]
    public void Parse_rejects_corrupt_nonblank_status(string raw)
    {
        Action act = () => SynthesizedArtifactSliceStatusParser.Parse(raw);
        act.Should().Throw<ArgumentException>();
    }
}
