using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphResolverPeeringTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_peering_from_nested_vnet_property()
    {
        Guid rowA = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid rowB = Guid.Parse("11111111-1111-4000-8000-000000000002");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(rowA, vnetA),
                CreateVnet(rowB, vnetB),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(vnetB),
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().ContainSingle(edge =>
            edge.EdgeType == GraphEdgeTypes.PeersWith
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryVnetPeering);
    }

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_peering_from_child_peering_resource()
    {
        Guid vnetRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid peerRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        Guid remoteRow = Guid.Parse("22222222-1111-4000-8000-000000000003");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        const string peeringId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/virtualNetworkPeerings/peer-to-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(vnetRow, vnetA),
                CreateVnet(remoteRow, vnetB),
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = peerRow,
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    AzureResourceId = peeringId,
                    ResourceType = "Microsoft.Network/virtualNetworks/virtualNetworkPeerings",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = vnetA,
                },
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peerRow,
                    PropertyKey = AzureInventoryVnetPeeringParser.RemoteVirtualNetworkIdPropertyKey,
                    PropertyValue = vnetB,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().ContainSingle(edge => edge.EdgeType == GraphEdgeTypes.PeersWith);
        result.Graph.Nodes.Should().NotContain(node =>
            string.Equals(node.Properties["arm.type"], "Microsoft.Network/virtualNetworks/virtualNetworkPeerings", StringComparison.Ordinal));
        result.Graph.Nodes.Should().HaveCount(2);
    }

    [Fact]
    public async Task TryResolveGraphAsync_does_not_duplicate_existing_peering_relationship()
    {
        Guid rowA = Guid.Parse("33333333-1111-4000-8000-000000000001");
        Guid rowB = Guid.Parse("33333333-1111-4000-8000-000000000002");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(rowA, vnetA),
                CreateVnet(rowB, vnetB),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(vnetB),
                },
            ],
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = vnetA,
                    ToAzureResourceId = vnetB,
                    RelationshipType = GraphEdgeTypes.PeersWith,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    InferenceSource = GraphEdgeInferenceSources.InventoryVnetPeering,
                },
            ]);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.PeersWith).Should().ContainSingle();
    }

    [Fact]
    public async Task TryResolveGraphAsync_skips_peering_when_remote_vnet_is_not_in_snapshot()
    {
        Guid rowA = Guid.Parse("44444444-1111-4000-8000-000000000001");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string missingRemote =
            "/subscriptions/other/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [CreateVnet(rowA, vnetA)],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(missingRemote),
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().BeEmpty();
    }

    [Fact]
    public async Task Executive_mermaid_labels_hydrated_vnet_peering_edges()
    {
        Guid rowA = Guid.Parse("55555555-1111-4000-8000-000000000001");
        Guid rowB = Guid.Parse("55555555-1111-4000-8000-000000000002");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/spoke-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/spoke-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(rowA, vnetA),
                CreateVnet(rowB, vnetB),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(vnetB),
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            result.Graph!,
            DiagramMode.Executive);
        string mermaid = new MermaidDiagramRenderer().Render(ast);

        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.Label == "peering");
        mermaid.Should().Contain("-->|\"peering\"|");
        mermaid.Should().Contain("spoke-a");
        mermaid.Should().Contain("spoke-b");
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AzureInventorySnapshotGraphResolver resolver = new(repository.Object);

        return await resolver.TryResolveGraphAsync(
            new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            SnapshotId,
            cancellationToken: CancellationToken.None);
    }

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        IReadOnlyList<AzureInventoryResourceRecord> resources,
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resources,
            Properties = properties,
            Relationships = relationships,
        };
    }

    private static string BuildPeeringsJson(string remoteVnetId)
    {
        return "[{\"properties\":{\"remoteVirtualNetwork\":{\"id\":\"" + remoteVnetId + "\"}}}]";
    }

    private static AzureInventoryResourceRecord CreateVnet(Guid resourceRowId, string azureResourceId)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = "Microsoft.Network/virtualNetworks",
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
