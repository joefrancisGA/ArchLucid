using System.Text.Json;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureIntelligenceMissingEvidenceTests
{
    [Fact]
    public void MissingClaimSupport_IsNotYetEvaluated()
    {
        Assert.Equal(SupportStatus.NotYetEvaluated, new ClaimProvenance().SupportStatus);
        Assert.Equal(SupportStatus.NotYetEvaluated, new ArchitectureModelElement().Provenance.SupportStatus);
        Assert.Equal(SupportStatus.NotYetEvaluated, new ArchitectureRecommendation().Provenance.SupportStatus);
    }

    [Theory]
    [InlineData("{}", SupportStatus.NotYetEvaluated)]
    [InlineData("{\"supportStatus\":0}", SupportStatus.DirectlyEstablished)]
    [InlineData("{\"supportStatus\":3}", SupportStatus.Unsupported)]
    public void DeserializeClaimSupport_PreservesExplicitValues(string json, SupportStatus expected)
    {
        var result = JsonSerializer.Deserialize<ClaimProvenance>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.NotNull(result);
        Assert.Equal(expected, result!.SupportStatus);
    }

    [Theory]
    [InlineData("{\"sourceTexts\":null}")]
    [InlineData("{\"sourceTexts\":[null,null]}")]
    public void DeserializeMissingSourceTexts_ReturnsEmptyCollection(string json)
    {
        var result = JsonSerializer.Deserialize<ClosedLoopReasoningRequest>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.NotNull(result);
        Assert.Empty(result!.SourceTexts);
    }

    [Fact]
    public void DeserializeMixedSourceTexts_PreservesValidEntries()
    {
        var result = JsonSerializer.Deserialize<ClosedLoopReasoningRequest>(
            """{"sourceTexts":[null,{"fileName":"architecture.txt","content":"Architecture evidence","contentType":"text/plain"},null]}""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.NotNull(result);
        var source = Assert.Single(result!.SourceTexts);
        Assert.Equal("Architecture evidence", source.Content);
    }
}
