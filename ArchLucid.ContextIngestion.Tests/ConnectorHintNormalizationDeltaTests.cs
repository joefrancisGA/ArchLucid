using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Topology;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class ConnectorHintNormalizationDeltaTests
{
    [Fact]
    public async Task SecurityBaselineHintsConnector_DeltaAsync_CaseChange_ReportsUnchanged()
    {
        SecurityBaselineHintsConnector connector = new(
            new SecurityBaselineHintsPayloadExtractor(),
            new SecurityBaselineHintsPayloadNormalizer(),
            new SetDiffConnectorDeltaComputer());

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { SecurityBaselineHints = ["Encrypt At Rest"] });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { SecurityBaselineHints = ["encrypt at rest"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task StaticRequestContextConnector_DeltaAsync_CaseChange_ReportsUnchanged()
    {
        StaticRequestContextConnector connector = new(
            new StaticRequestPayloadExtractor(),
            new StaticRequestPayloadNormalizer(),
            new SetDiffConnectorDeltaComputer());

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { Description = "Billing API redesign" });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { Description = "billing api redesign" },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
    }

    [Fact]
    public async Task StaticRequestContextConnector_DeltaAsync_PaddedDescription_ReportsUnchanged()
    {
        StaticRequestContextConnector connector = new(
            new StaticRequestPayloadExtractor(),
            new StaticRequestPayloadNormalizer(),
            new SetDiffConnectorDeltaComputer());

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { Description = "billing api redesign" });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { Description = " billing api redesign " },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
    }

    [Fact]
    public async Task SecurityBaselineHintsConnector_DeltaAsync_PaddedHint_ReportsUnchanged()
    {
        SecurityBaselineHintsConnector connector = new(
            new SecurityBaselineHintsPayloadExtractor(),
            new SecurityBaselineHintsPayloadNormalizer(),
            new SetDiffConnectorDeltaComputer());

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { SecurityBaselineHints = ["private endpoints"] });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { SecurityBaselineHints = [" private endpoints "] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
    }

    [Fact]
    public async Task InlineRequirementsConnector_DeltaAsync_CaseChange_ReportsUnchanged()
    {
        InlineRequirementsConnector connector = new(
            new InlineRequirementsPayloadExtractor(),
            new InlineRequirementsPayloadNormalizer(),
            new SetDiffConnectorDeltaComputer());

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { InlineRequirements = ["Must Encrypt"] });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { InlineRequirements = ["must encrypt"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task InlineRequirementsConnector_DeltaAsync_PaddedRequirement_ReportsUnchanged()
    {
        InlineRequirementsConnector connector = new(
            new InlineRequirementsPayloadExtractor(),
            new InlineRequirementsPayloadNormalizer(),
            new SetDiffConnectorDeltaComputer());

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { InlineRequirements = ["must encrypt"] });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { InlineRequirements = [" must encrypt "] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
    }

    [Fact]
    public async Task TopologyHintsConnector_DeltaAsync_CaseChange_ReportsUnchanged()
    {
        TopologyHintsConnector connector = CreateTopologyConnector();

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { TopologyHints = ["Hub-VNet"] });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { TopologyHints = ["hub-vnet"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task TopologyHintsConnector_NormalizeAsync_WhitespaceOnlyHint_IsSkipped()
    {
        TopologyHintsConnector connector = CreateTopologyConnector();

        NormalizedContextBatch batch = await connector.NormalizeAsync(
            new RawContextPayload { TopologyHints = ["   ", "hub-vnet"] },
            CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task TopologyHintsConnector_DeltaAsync_SlashSpacingChange_ReportsUnchanged()
    {
        TopologyHintsConnector connector = CreateTopologyConnector();

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { TopologyHints = ["parentNet/childSubnet"] });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { TopologyHints = ["parentNet / childSubnet"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task TopologyHintsConnector_DeltaAsync_ThreeSegmentInnerSlashSpacing_ReportsUnchanged()
    {
        TopologyHintsConnector connector = CreateTopologyConnector();

        ContextSnapshot previous = await SnapshotAsync(
            connector,
            new RawContextPayload { TopologyHints = ["prod/vnet/subnet-a"] });

        NormalizedContextBatch currentBatch = await connector.NormalizeAsync(
            new RawContextPayload { TopologyHints = ["prod / vnet / subnet-a"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task JsonInfrastructureDeclarationParser_ResourceTypeCasing_IsCanonicalized()
    {
        JsonInfrastructureDeclarationParser parser = new(NullLogger<JsonInfrastructureDeclarationParser>.Instance);
        InfrastructureDeclarationReference declaration = new()
        {
            DeclarationId = "decl-1",
            Name = "network.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          { "type": "VNet", "name": "hub-vnet" }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await parser.ParseAsync(declaration, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["resourceType"].Should().Be("vnet");
    }

    [Fact]
    public async Task SecurityBaselineHintsNormalizer_Reparse_ProducesStableObjectId()
    {
        SecurityBaselineHintsPayloadNormalizer sut = new();

        SecurityBaselineHintsPayload payload = new() { SecurityBaselineHints = ["encrypt at rest"] };

        NormalizedContextBatch first = await sut.NormalizeAsync(payload, CancellationToken.None);
        NormalizedContextBatch second = await sut.NormalizeAsync(payload, CancellationToken.None);

        first.CanonicalObjects.Should().ContainSingle();
        second.CanonicalObjects[0].ObjectId.Should().Be(first.CanonicalObjects[0].ObjectId);
    }

    [Fact]
    public async Task StaticRequestNormalizer_Reparse_ProducesStableObjectId()
    {
        StaticRequestPayloadNormalizer sut = new();

        StaticRequestPayload payload = new() { Description = "billing api redesign" };

        NormalizedContextBatch first = await sut.NormalizeAsync(payload, CancellationToken.None);
        NormalizedContextBatch second = await sut.NormalizeAsync(payload, CancellationToken.None);

        first.CanonicalObjects.Should().ContainSingle();
        second.CanonicalObjects[0].ObjectId.Should().Be(first.CanonicalObjects[0].ObjectId);
    }

    [Fact]
    public async Task PolicyReferenceNormalizer_Reparse_ProducesStableObjectId()
    {
        PolicyReferencePayloadNormalizer sut = new(new PolicyTopologyOverlapResolver());

        PolicyReferencePayload payload = new() { PolicyReferences = ["soc2"] };

        NormalizedContextBatch first = await sut.NormalizeAsync(payload, CancellationToken.None);
        NormalizedContextBatch second = await sut.NormalizeAsync(payload, CancellationToken.None);

        first.CanonicalObjects.Should().ContainSingle();
        second.CanonicalObjects[0].ObjectId.Should().Be(first.CanonicalObjects[0].ObjectId);
    }

    private static TopologyHintsConnector CreateTopologyConnector() =>
        new(
            new TopologyHintsPayloadExtractor(),
            new TopologyHintsPayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

    private static async Task<ContextSnapshot> SnapshotAsync(
        IContextConnector connector,
        RawContextPayload raw)
    {
        NormalizedContextBatch batch = await connector.NormalizeAsync(raw, CancellationToken.None);

        return new ContextSnapshot
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects = batch.CanonicalObjects,
        };
    }
}
