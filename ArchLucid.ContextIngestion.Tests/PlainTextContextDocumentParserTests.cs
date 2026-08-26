using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Plain Text Context Document Parser.
/// </summary>
[Trait("Suite", "Core")]
public sealed class PlainTextContextDocumentParserTests
{
    private readonly PlainTextContextDocumentParser _sut = new();

    [Fact]
    public async Task ParseAsync_ExtractsPrefixedLines()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.md",
            ContentType = "text/markdown",
            Content = """
                      REQ: System must be HA
                      POL: SOC2 alignment
                      TOP: subnet-ingress
                      SEC: encrypt at rest
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(doc, CancellationToken.None);

        result.Should().HaveCount(4);
        result.Select(o => o.ObjectType).Should().Equal(
            "Requirement",
            "PolicyControl",
            "TopologyResource",
            "SecurityBaseline");
        result[0].Properties["text"].Should().Be("system must be ha");
        result[0].SourceId.Should().Be(doc.DocumentId);
    }

    [Fact]
    public async Task ParseAsync_BlankPrefixedLine_SkipsEntry()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = """
                      REQ: Must scale horizontally
                      REQ:
                      REQ:   
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(doc, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["text"].Should().Be("must scale horizontally");
    }

    [Fact]
    public async Task ParseAsync_Utf8BomReqLine_ExtractsRequirement()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "\uFEFFREQ: Must scale horizontally"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(doc, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("Requirement");
        result[0].Properties["text"].Should().Be("must scale horizontally");
    }
}
