using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class AzureInventorySnapshotGraphResolverExternalSourceHostTests
{
    private static readonly Guid SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid TenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    [Fact]
    public async Task ResolveGraph_collapses_external_nodes_that_share_a_host()
    {
        const string factoryDev =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev";
        const string factoryTst =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-tst";
        const string host = "files.partner.example";
        string externalDev = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(factoryDev, "fsxp_sftp");
        string externalTst = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(factoryTst, "fsxp_sftp");
        string rollupKey = AzureInventoryAdfExternalSourceNodeFactory.BuildHostRollupNodeKey("Sftp", host);

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                Resource(factoryDev, "Microsoft.DataFactory/factories", "adf-edw-hi-dev"),
                Resource(factoryTst, "Microsoft.DataFactory/factories", "adf-edw-hi-tst"),
            ],
            Relationships =
            [
                Relationship(factoryDev, externalDev),
                Relationship(factoryTst, externalTst),
            ],
            AdfExternalSources =
            [
                ExternalSource(externalDev, factoryDev, "fsxp_sftp", "Sftp", host),
                ExternalSource(externalTst, factoryTst, "fsxp_sftp", "Sftp", host),
            ],
        };

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Nodes.Should().ContainSingle(node =>
            string.Equals(node.NodeId, rollupKey, StringComparison.OrdinalIgnoreCase));
        result.Graph.Nodes.Should().NotContain(node =>
            AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(node.NodeId));
        result.Graph.Edges.Should().Contain(edge =>
            string.Equals(edge.FromNodeId, ResolveNodeId(factoryDev, result.Graph.Nodes), StringComparison.Ordinal)
            && string.Equals(edge.ToNodeId, rollupKey, StringComparison.Ordinal));
        result.Graph.Edges.Should().Contain(edge =>
            string.Equals(edge.FromNodeId, ResolveNodeId(factoryTst, result.Graph.Nodes), StringComparison.Ordinal)
            && string.Equals(edge.ToNodeId, rollupKey, StringComparison.Ordinal));
    }

    [Fact]
    public async Task ResolveGraph_remaps_blob_host_to_storage_account()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string host = "sa1.blob.core.windows.net";
        string externalKey = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(factoryId, "blobLs");

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                Resource(factoryId, "Microsoft.DataFactory/factories", "adf1"),
                Resource(storageId, "Microsoft.Storage/storageAccounts", "sa1"),
            ],
            Relationships = [Relationship(factoryId, externalKey)],
            AdfExternalSources =
            [
                ExternalSource(externalKey, factoryId, "blobLs", "AzureBlobStorage", host),
            ],
        };

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Nodes.Should().NotContain(node =>
            string.Equals(node.NodeId, externalKey, StringComparison.OrdinalIgnoreCase));
        string storageNodeId = ResolveNodeId(storageId, result.Graph.Nodes);
        result.Graph.Edges.Should().ContainSingle(edge =>
            string.Equals(edge.FromNodeId, ResolveNodeId(factoryId, result.Graph.Nodes), StringComparison.Ordinal)
            && string.Equals(edge.ToNodeId, storageNodeId, StringComparison.Ordinal));
    }

    [Fact]
    public async Task ResolveGraph_keeps_empty_host_external_nodes_separate()
    {
        const string factoryA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-a";
        const string factoryB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-b";
        string externalA = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(factoryA, "ls-a");
        string externalB = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(factoryB, "ls-b");

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                Resource(factoryA, "Microsoft.DataFactory/factories", "adf-a"),
                Resource(factoryB, "Microsoft.DataFactory/factories", "adf-b"),
            ],
            Relationships =
            [
                Relationship(factoryA, externalA),
                Relationship(factoryB, externalB),
            ],
            AdfExternalSources =
            [
                ExternalSource(externalA, factoryA, "ls-a", "Http", null),
                ExternalSource(externalB, factoryB, "ls-b", "Http", null),
            ],
        };

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Nodes.Count(node => AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(node.NodeId))
            .Should()
            .Be(2);
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AzureInventorySnapshotGraphResolver resolver = new(repository.Object);

        return await resolver.TryResolveGraphAsync(
            new ScopeContext { TenantId = TenantId },
            SnapshotId);
    }

    private static AzureInventoryResourceRecord Resource(string armId, string resourceType, string nameSuffix)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = Guid.NewGuid(),
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            CloudResourceId = Guid.NewGuid(),
            AzureResourceId = armId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }

    private static AzureInventoryResourceRelationshipReadModel Relationship(string fromArmId, string toArmId)
    {
        return new AzureInventoryResourceRelationshipReadModel
        {
            FromAzureResourceId = fromArmId,
            ToAzureResourceId = toArmId,
            RelationshipType = AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred,
            InferenceSource = GraphEdgeInferenceSources.InventoryAdfLinkedService,
            ProvenanceKind = ProvenanceKind.DeterministicInference,
        };
    }

    private static AzureInventoryAdfExternalSourceReadModel ExternalSource(
        string externalNodeKey,
        string factoryResourceId,
        string linkedServiceName,
        string linkedServiceType,
        string? targetHost)
    {
        return new AzureInventoryAdfExternalSourceReadModel
        {
            ExternalNodeKey = externalNodeKey,
            FactoryResourceId = factoryResourceId,
            LinkedServiceName = linkedServiceName,
            LinkedServiceType = linkedServiceType,
            TargetHost = targetHost,
        };
    }

    private static string ResolveNodeId(string armId, IReadOnlyList<GraphNode> nodes)
    {
        return nodes
            .Single(node =>
                node.Properties.TryGetValue("arm.id", out string? value)
                && string.Equals(
                    ArmResourceIdNormalizer.Normalize(value),
                    ArmResourceIdNormalizer.Normalize(armId),
                    StringComparison.OrdinalIgnoreCase))
            .NodeId;
    }
}
