using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
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
public sealed class AzureInventorySnapshotGraphResolverPrivateEndpointTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_private_endpoint_target_from_property()
    {
        Guid peRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid mysqlRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pemdp-mysqlbamtest";
        const string mysqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforMySQL/flexibleServers/mysql-bam-hi-dev";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                CreateResource(mysqlRow, mysqlArmId, "Microsoft.DBforMySQL/flexibleServers"),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peRow,
                    PropertyKey = "privateLinkServiceId",
                    PropertyValue = mysqlArmId,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().ContainSingle(edge =>
            edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, DiagramMode.Executive);
        DiagramForestLayoutResult svg = new DiagramForestLayoutSvgRenderer().Render(ast);

        ast.Nodes.Should().ContainSingle(node => node.Label == "mysql-bam-hi-dev");
        ast.Nodes.Single(node => node.Label == "mysql-bam-hi-dev").HasPrivateEndpointAccess.Should().BeTrue();
        ast.Nodes.Should().NotContain(node => node.Label == "pemdp-mysqlbamtest");
        svg.Svg.Should().Contain("class=\"private-endpoint-lock\"");
        svg.Svg.Should().Contain("class=\"private-endpoint-arrow\"");
    }

    [Fact]
    public async Task TryResolveGraphAsync_maps_parent_private_link_id_onto_child_resource()
    {
        Guid peRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid dbRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string serverArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";
        const string databaseArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                CreateResource(dbRow, databaseArmId, "Microsoft.Sql/servers/databases"),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peRow,
                    PropertyKey = "privateLinkServiceId",
                    PropertyValue = serverArmId,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, DiagramMode.FullSubscription);
        ast.Nodes.Single(node => node.Label == "app").HasPrivateEndpointAccess.Should().BeTrue();
        ast.Nodes.Should().NotContain(node => node.Label == "pe-sql");
    }

    [Fact]
    public async Task TryResolveGraphAsync_connects_hidden_private_endpoint_target_to_vnet_without_membership()
    {
        Guid peRow = Guid.Parse("33333333-1111-4000-8000-000000000001");
        Guid vnetRow = Guid.Parse("33333333-1111-4000-8000-000000000002");
        Guid keyVaultRow = Guid.Parse("33333333-1111-4000-8000-000000000003");
        const string peArmId =
            "/subscriptions/sub/resourceGroups/pe-rg/providers/Microsoft.Network/privateEndpoints/pe-kv";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/vnet-a/subnets/private";
        const string keyVaultArmId =
            "/subscriptions/sub/resourceGroups/data-rg/providers/Microsoft.KeyVault/vaults/kv-a";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                CreateResource(keyVaultRow, keyVaultArmId, "Microsoft.KeyVault/vaults"),
            ],
            [],
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = peArmId,
                    ToAzureResourceId = subnetArmId,
                    RelationshipType = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPeSubnet,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = peArmId,
                    ToAzureResourceId = keyVaultArmId,
                    RelationshipType = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                },
            ]);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph!, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label == "pe-kv");
        ast.Edges.Should().Contain(edge =>
            edge.Label == InventoryDiagramRelationshipLabelTexts.PrivateAccess
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint);
        ast.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryPeSubnet
            && edge.FromNodeId.Contains("kv-a", StringComparison.OrdinalIgnoreCase));
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

    private static AzureInventoryResourceRecord CreateResource(Guid resourceRowId, string azureResourceId, string resourceType)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
