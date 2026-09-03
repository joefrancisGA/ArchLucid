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
}
