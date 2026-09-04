using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.ContextIngestion.Topology;

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

    [Fact]
    public async Task ParseAsync_TopLine_Reparse_ProducesStableObjectId()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "TOP: hub-vnet"
        };

        IReadOnlyList<CanonicalObject> first = await _sut.ParseAsync(doc, CancellationToken.None);
        IReadOnlyList<CanonicalObject> second = await _sut.ParseAsync(doc, CancellationToken.None);

        first.Should().ContainSingle();
        first[0].ObjectId.Should().Be(second[0].ObjectId);
        first[0].ObjectId.Should().Be(TopologyHintStableObjectIds.FromHintName("hub-vnet"));
    }

    [Fact]
    public async Task ParseAsync_TopSlashHint_SetsStableObjectIdAndParentNodeId()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "TOP: parentNet/childSubnet"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(doc, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectId.Should().Be(TopologyHintStableObjectIds.FromHintName("parentnet/childsubnet"));
        result[0].Properties["parentNodeId"].Should()
            .Be($"obj-{TopologyHintStableObjectIds.FromHintName("parentnet")}");
    }

    [Fact]
    public async Task ParseAsync_RequirementLine_Reparse_ProducesStableObjectId()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "REQ: Must scale horizontally"
        };

        IReadOnlyList<CanonicalObject> first = await _sut.ParseAsync(doc, CancellationToken.None);
        IReadOnlyList<CanonicalObject> second = await _sut.ParseAsync(doc, CancellationToken.None);

        first.Should().ContainSingle();
        first[0].ObjectId.Should().Be(second[0].ObjectId);
        first[0].ObjectId.Should().Be(ContextIngestionStableLineNames.StableObjectId("Requirement", "must scale horizontally"));
    }

    [Fact]
    public async Task ParseAsync_SpacedPrefixBeforeColon_ExtractsRequirement()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "REQ : Must scale horizontally"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(doc, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("Requirement");
        result[0].Properties["text"].Should().Be("must scale horizontally");
    }

    [Fact]
    public async Task ParseAsync_SpacedPolPrefixBeforeColon_ExtractsPolicyControl()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "POL : SOC2 alignment"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(doc, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("PolicyControl");
        result[0].Properties["text"].Should().Be("soc2 alignment");
    }

    [Fact]
    public async Task ParseAsync_SpacedSecPrefixBeforeColon_ExtractsSecurityBaseline()
    {
        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "SEC : encrypt at rest"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(doc, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("SecurityBaseline");
        result[0].Properties["text"].Should().Be("encrypt at rest");
    }

    [Fact]
    public async Task ParseAsync_RequirementInternalWhitespace_Reparse_ProducesStableObjectId()
    {
        ContextDocumentReference spaced = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "REQ: Must  Encrypt"
        };

        ContextDocumentReference normalized = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = "REQ: Must Encrypt"
        };

        IReadOnlyList<CanonicalObject> spacedResult = await _sut.ParseAsync(spaced, CancellationToken.None);
        IReadOnlyList<CanonicalObject> normalizedResult = await _sut.ParseAsync(normalized, CancellationToken.None);

        spacedResult.Should().ContainSingle();
        normalizedResult.Should().ContainSingle();
        spacedResult[0].ObjectId.Should().Be(normalizedResult[0].ObjectId);
        spacedResult[0].Properties["text"].Should().Be("must encrypt");
    }
}
