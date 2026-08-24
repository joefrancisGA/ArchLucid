using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Topology;

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
        batch.CanonicalObjects[0].Name.Should().Be("SOC2");
        batch.CanonicalObjects[0].SourceId.Should().Be("SOC2");
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
}
