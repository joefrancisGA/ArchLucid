using ArchLucid.ContextIngestion.Parsing;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class PlainTextDocumentTopologyHintExtractorTests
{
    [Fact]
    public void EnumerateHintNames_SpacedPrefixBeforeColon_ExtractsTopologyHint()
    {
        IEnumerable<string> hints = PlainTextDocumentTopologyHintExtractor.EnumerateHintNames("TOP : parentNet/childSubnet");

        hints.Should().ContainSingle().Which.Should().Be("parentnet/childsubnet");
    }

    [Fact]
    public void EnumerateHintNames_TabIndentedTopLine_MatchesParser()
    {
        const string content = "\tTOP:\tparentNet/childSubnet";

        IEnumerable<string> hints = PlainTextDocumentTopologyHintExtractor.EnumerateHintNames(content);

        hints.Should().ContainSingle().Which.Should().Be("parentnet/childsubnet");
    }
}
