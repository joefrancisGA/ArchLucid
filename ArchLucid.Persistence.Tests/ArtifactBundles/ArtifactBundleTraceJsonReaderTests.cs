using ArchLucid.Persistence.ArtifactBundles;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Tests.ArtifactBundles;

[Trait("Category", "Unit")]
public sealed class ArtifactBundleTraceJsonReaderTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void DeserializeTraceBase_blank_json_returns_empty_trace(string? json)
    {
        SynthesisTrace trace = ArtifactBundleTraceJsonReader.DeserializeTraceBase(json);

        trace.Should().NotBeNull();
        trace.GeneratorsUsed.Should().BeEmpty();
    }

    [Fact]
    public void DeserializeTraceBase_valid_json_round_trips()
    {
        SynthesisTrace expected = new() { GeneratorsUsed = ["alpha", "beta"] };
        string json = JsonEntitySerializer.Serialize(expected);

        SynthesisTrace trace = ArtifactBundleTraceJsonReader.DeserializeTraceBase(json);

        trace.GeneratorsUsed.Should().Equal("alpha", "beta");
    }
}
