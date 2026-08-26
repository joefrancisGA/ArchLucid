using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.ContextIngestion.Topology;
using ArchLucid.Contracts.Persistence.Context;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Policy Reference Connector Topology.
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyReferenceConnectorTopologyTests
{
    [Fact]
    public async Task NormalizeAsync_WhenPolicyOverlapsTopologyHint_SetsApplicableTopologyNodeIds()
    {
        PolicyReferenceConnector sut = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());
        RawContextPayload raw = new()
        {
            PolicyReferences = ["prod-vnet-policy"], TopologyHints = ["prod-vnet-policy-subnet"]
        };

        NormalizedContextBatch batch = await sut.NormalizeAsync(raw, CancellationToken.None);

        CanonicalObject policy = batch.CanonicalObjects.Single();
        policy.Properties.Should().ContainKey("applicableTopologyNodeIds");
        string ids = policy.Properties["applicableTopologyNodeIds"];
        ids.Should().StartWith("obj-");
        ids.Split(',', StringSplitOptions.RemoveEmptyEntries).Should().HaveCount(1);
    }

    [Fact]
    public async Task NormalizeAsync_WhenNoOverlap_OmitsApplicableTopologyNodeIds()
    {
        PolicyReferenceConnector sut = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());
        RawContextPayload raw = new() { PolicyReferences = ["SOC2"], TopologyHints = ["unrelated-vnet"] };

        NormalizedContextBatch batch = await sut.NormalizeAsync(raw, CancellationToken.None);

        batch.CanonicalObjects.Single().Properties.Should().NotContainKey("applicableTopologyNodeIds");
    }

    [Fact]
    public async Task NormalizeAsync_TrimsWhitespacePolicyReferences()
    {
        PolicyReferenceConnector sut = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());
        RawContextPayload raw = new() { PolicyReferences = [" SOC2 ", "SOC2"] };

        NormalizedContextBatch batch = await sut.NormalizeAsync(raw, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Name.Should().Be("soc2");
        batch.CanonicalObjects[0].SourceId.Should().Be("soc2");
    }

    [Fact]
    public async Task NormalizeAsync_WhenPolicyOverlapsDocumentTopologyHint_SetsApplicableTopologyNodeIds()
    {
        PolicyReferenceConnector sut = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        DocumentConnector documentConnector = new(
            new DocumentConnectorPayloadExtractor(),
            new DocumentConnectorPayloadNormalizer([new PlainTextContextDocumentParser()]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload documentRaw = new()
        {
            Documents =
            [
                new ContextDocumentReference
                {
                    DocumentId = "doc-1",
                    Name = "topology.txt",
                    ContentType = "text/plain",
                    Content = "TOP: parentNet/childSubnet"
                }
            ]
        };

        NormalizedContextBatch documentBatch = await documentConnector.NormalizeAsync(documentRaw, CancellationToken.None);
        string topologyObjectId = documentBatch.CanonicalObjects.Single().ObjectId;

        ContextIngestionRequest request = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            PolicyReferences = ["parentNet"],
            Documents =
            [
                new ContextDocumentReference
                {
                    DocumentId = "doc-1",
                    Name = "topology.txt",
                    ContentType = "text/plain",
                    Content = "TOP: parentNet/childSubnet"
                }
            ]
        };

        RawContextPayload policyRaw = await sut.FetchAsync(request, CancellationToken.None);
        NormalizedContextBatch policyBatch = await sut.NormalizeAsync(policyRaw, CancellationToken.None);

        policyBatch.CanonicalObjects.Single().Properties["applicableTopologyNodeIds"]
            .Should().Be($"obj-{topologyObjectId}");
    }

    [Fact]
    public async Task NormalizeAsync_WhenPolicyOverlapsSlashSpacedTopologyHint_UsesCanonicalTopologyObjectId()
    {
        PolicyReferenceConnector sut = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        TopologyHintsConnector topologyConnector = new(
            new TopologyHintsPayloadExtractor(),
            new TopologyHintsPayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload topologyRaw = new() { TopologyHints = ["parentNet / childSubnet"] };
        NormalizedContextBatch topologyBatch = await topologyConnector.NormalizeAsync(topologyRaw, CancellationToken.None);
        string topologyObjectId = topologyBatch.CanonicalObjects.Single().ObjectId;

        RawContextPayload policyRaw = new()
        {
            PolicyReferences = ["childSubnet"],
            TopologyHints = ["parentNet / childSubnet"]
        };

        NormalizedContextBatch policyBatch = await sut.NormalizeAsync(policyRaw, CancellationToken.None);

        CanonicalObject policy = policyBatch.CanonicalObjects.Single();
        policy.Properties.Should().ContainKey("applicableTopologyNodeIds");
        policy.Properties["applicableTopologyNodeIds"].Should().Be($"obj-{topologyObjectId}");
    }

    [Fact]
    public async Task NormalizeAsync_WhenSlashSpacedPolicyReferenceOverlapsCanonicalTopologyHint_UsesCanonicalTopologyObjectId()
    {
        PolicyReferenceConnector sut = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        TopologyHintsConnector topologyConnector = new(
            new TopologyHintsPayloadExtractor(),
            new TopologyHintsPayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload topologyRaw = new() { TopologyHints = ["parentNet/childSubnet"] };
        NormalizedContextBatch topologyBatch = await topologyConnector.NormalizeAsync(topologyRaw, CancellationToken.None);
        string topologyObjectId = topologyBatch.CanonicalObjects.Single().ObjectId;

        RawContextPayload policyRaw = new()
        {
            PolicyReferences = ["parentNet / childSubnet"],
            TopologyHints = ["parentNet/childSubnet"]
        };

        NormalizedContextBatch policyBatch = await sut.NormalizeAsync(policyRaw, CancellationToken.None);

        CanonicalObject policy = policyBatch.CanonicalObjects.Single();
        policy.Properties.Should().ContainKey("applicableTopologyNodeIds");
        policy.Properties["applicableTopologyNodeIds"].Should().Be($"obj-{topologyObjectId}");
    }

    [Fact]
    public async Task NormalizeAsync_WhenPolicyOverlapsDifferentlyCasedTopologyHint_UsesCanonicalTopologyObjectId()
    {
        PolicyReferenceConnector sut = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        TopologyHintsConnector topologyConnector = new(
            new TopologyHintsPayloadExtractor(),
            new TopologyHintsPayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload topologyRaw = new() { TopologyHints = ["parentNet/childSubnet"] };
        NormalizedContextBatch topologyBatch = await topologyConnector.NormalizeAsync(topologyRaw, CancellationToken.None);
        string topologyObjectId = topologyBatch.CanonicalObjects.Single().ObjectId;

        RawContextPayload policyRaw = new()
        {
            PolicyReferences = ["childSubnet"],
            TopologyHints = ["PARENTNET / CHILDSUBNET"]
        };

        NormalizedContextBatch policyBatch = await sut.NormalizeAsync(policyRaw, CancellationToken.None);

        CanonicalObject policy = policyBatch.CanonicalObjects.Single();
        policy.Properties.Should().ContainKey("applicableTopologyNodeIds");
        policy.Properties["applicableTopologyNodeIds"].Should().Be($"obj-{topologyObjectId}");
    }

    [Fact]
    public async Task DeltaAsync_PaddedPolicyReference_ReportsUnchanged()
    {
        PolicyReferenceConnector connector = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new() { PolicyReferences = ["SOC2"] };
        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new() { PolicyReferences = [" SOC2 "] };
        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
        delta.UnchangedCount.Should().Be(1);
    }

    [Fact]
    public async Task DeltaAsync_OverlappingTopologyHintListOrder_ReportsUnchanged()
    {
        PolicyReferenceConnector connector = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new()
        {
            PolicyReferences = ["prod"],
            TopologyHints = ["prod-vnet", "prod-subnet"],
        };
        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new()
        {
            PolicyReferences = ["prod"],
            TopologyHints = ["prod-subnet", "prod-vnet"],
        };
        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
        delta.UnchangedCount.Should().Be(1);
    }

    [Fact]
    public async Task DeltaAsync_PolicyReferenceCaseChange_ReportsUnchanged()
    {
        PolicyReferenceConnector connector = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new() { PolicyReferences = ["SOC2"] };
        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new() { PolicyReferences = ["soc2"] };
        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
        delta.UnchangedCount.Should().Be(1);
    }
}
