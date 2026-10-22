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
    [InlineData("unknown")]
    public void Parse_defaults_to_generated_when_invalid_or_missing(string? raw)
    {
        SynthesizedArtifactGenerationStatus actual = SynthesizedArtifactSliceStatusParser.Parse(raw);

        actual.Should().Be(SynthesizedArtifactGenerationStatus.Generated);
    }
}
