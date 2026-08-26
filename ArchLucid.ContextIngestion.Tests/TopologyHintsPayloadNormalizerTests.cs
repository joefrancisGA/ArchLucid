using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.ContextIngestion.Topology;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class TopologyHintsPayloadNormalizerTests
{
    private readonly TopologyHintsPayloadNormalizer _sut =
        new(new PolicyTopologyOverlapResolver());

    private readonly PlainTextContextDocumentParser _documentParser = new();

    [Fact]
    public async Task NormalizeAsync_DuplicateHints_EmitsSingleCanonicalObject()
    {
        NormalizedContextBatch batch = await _sut.NormalizeAsync(
            new TopologyHintsPayload { TopologyHints = ["prod/vnet", " prod/vnet "] },
            CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Properties["text"].Should().Be("prod/vnet");
    }

    [Fact]
    public async Task NormalizeAsync_LongHint_UsesTruncatedDisplayName()
    {
        string longHint = new('a', 81);

        NormalizedContextBatch batch = await _sut.NormalizeAsync(
            new TopologyHintsPayload { TopologyHints = [longHint] },
            CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Name.Should().Be(ContextIngestionStableLineNames.BuildDisplayName(longHint.ToLowerInvariant()));
        batch.CanonicalObjects[0].Name.Should().Contain("#");
        batch.CanonicalObjects[0].Properties["text"].Should().Be(longHint.ToLowerInvariant());
    }

    [Fact]
    public async Task NormalizeAsync_LongHintsWithSharedNamePrefix_UseDistinctNames()
    {
        string sharedPrefix = new('a', 80);
        string first = sharedPrefix + "suffix-one";
        string second = sharedPrefix + "suffix-two";

        NormalizedContextBatch batch = await _sut.NormalizeAsync(
            new TopologyHintsPayload { TopologyHints = [first, second] },
            CancellationToken.None);

        batch.CanonicalObjects.Should().HaveCount(2);
        batch.CanonicalObjects.Select(static o => o.Name).Distinct(StringComparer.Ordinal).Should().HaveCount(2);
        batch.CanonicalObjects.Should().OnlyContain(o => o.Name.StartsWith(sharedPrefix, StringComparison.Ordinal));
        batch.CanonicalObjects.Should().OnlyContain(o => o.Name.Contains('#'));
    }

    [Fact]
    public async Task NormalizeAsync_LongHint_MatchesDocumentTopologyResourceName()
    {
        string longHint = new string('b', 95) + "/subnet-a";

        NormalizedContextBatch connectorBatch = await _sut.NormalizeAsync(
            new TopologyHintsPayload { TopologyHints = [longHint] },
            CancellationToken.None);

        ContextDocumentReference doc = new()
        {
            Name = "spec.txt",
            ContentType = "text/plain",
            Content = $"TOP: {longHint}"
        };

        IReadOnlyList<CanonicalObject> documentObjects =
            await _documentParser.ParseAsync(doc, CancellationToken.None);

        connectorBatch.CanonicalObjects.Should().ContainSingle();
        documentObjects.Should().ContainSingle();

        connectorBatch.CanonicalObjects[0].Name.Should().Be(documentObjects[0].Name);
        connectorBatch.CanonicalObjects[0].ObjectId.Should().Be(documentObjects[0].ObjectId);
    }
}
