using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandLlmJudgmentParserTests
{
    [Theory]
    [InlineData("{\"band\":\"Supported\"}", FindingSemanticSupportBand.Supported)]
    [InlineData("{\"band\":\"unchecked\"}", FindingSemanticSupportBand.Unchecked)]
    [InlineData("{\"band\":\"UNSUPPORTED\"}", FindingSemanticSupportBand.Unsupported)]
    public void TryParse_reads_known_bands(string json, FindingSemanticSupportBand expected)
    {
        FindingSemanticSupportBandLlmJudgmentParser.TryParse(json).Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-json")]
    [InlineData("{}")]
    [InlineData("{\"band\":\"\"}")]
    [InlineData("{\"band\":\"NotScored\"}")]
    [InlineData("{\"band\":\"Maybe\"}")]
    public void TryParse_returns_null_for_unknown_or_empty(string? json)
    {
        FindingSemanticSupportBandLlmJudgmentParser.TryParse(json).Should().BeNull();
    }
}
