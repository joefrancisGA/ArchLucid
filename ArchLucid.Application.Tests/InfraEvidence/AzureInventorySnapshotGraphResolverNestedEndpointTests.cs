using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
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
public sealed class AzureInventorySnapshotGraphResolverNestedEndpointTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_maps_nic_subnet_hop_onto_vnet_when_subnet_row_missing()
    {
        Guid vmRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid nicRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        Guid vnetRow = Guid.Parse("11111111-1111-4000-8000-000000000003");
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/vm-app-nic";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/app";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(vmRow, vmArmId, "Microsoft.Compute/virtualMachines"),
                CreateResource(nicRow, nicArmId, "Microsoft.Network/networkInterfaces"),
                CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
            ],
            [],
            [
                CreateRelationship(vmArmId, nicArmId, GraphEdgeTypes.ConnectsTo, GraphEdgeInferenceSources.InventoryVmNic),
                CreateRelationship(
                    nicArmId,
                    subnetArmId,
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryNicSubnet),
            ]);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node =>
            string.Equals(node.ArmResourceType, "Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "vm-app", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "vnet-app", StringComparison.Ordinal));

        DiagramEdge? inVnet = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .SingleOrDefault(edge => string.Equals(edge.Label, "in", StringComparison.OrdinalIgnoreCase));
        inVnet.Should().NotBeNull();
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inVnet!.FromNodeId && string.Equals(node.Label, "vm-app", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inVnet!.ToNodeId && string.Equals(node.Label, "vnet-app", StringComparison.Ordinal));
    }

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_nic_subnet_from_property_when_relationship_missing()
    {
        Guid nicRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid vnetRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/vm-nic";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/app";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(nicRow, nicArmId, "Microsoft.Network/networkInterfaces"),
                CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = nicRow,
                    PropertyKey = "ipConfiguration.subnet.id",
                    PropertyValue = subnetArmId,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet);
    }

    [Fact]
    public async Task TryResolveGraphAsync_places_private_endpoint_target_in_vnet_when_subnet_row_missing()
    {
        Guid peRow = Guid.Parse("33333333-1111-4000-8000-000000000001");
        Guid sqlRow = Guid.Parse("33333333-1111-4000-8000-000000000002");
        Guid vnetRow = Guid.Parse("33333333-1111-4000-8000-000000000003");
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string sqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-data";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-data/subnets/data";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                CreateResource(sqlRow, sqlArmId, "Microsoft.Sql/servers"),
                CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peRow,
                    PropertyKey = "privateLinkServiceId",
                    PropertyValue = sqlArmId,
                },
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peRow,
                    PropertyKey = "subnet.id",
                    PropertyValue = subnetArmId,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph!, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => string.Equals(node.Label, "pe-sql", StringComparison.Ordinal));
        ast.Nodes.Single(node => node.Label == "sql").HasPrivateEndpointAccess.Should().BeTrue();

        DiagramEdge? inVnet = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .SingleOrDefault(edge => string.Equals(edge.Label, "in", StringComparison.OrdinalIgnoreCase));
        inVnet.Should().NotBeNull();
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inVnet!.FromNodeId && string.Equals(node.Label, "sql", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inVnet!.ToNodeId && string.Equals(node.Label, "vnet-data", StringComparison.Ordinal));
    }

    [Fact]
    public async Task TryResolveGraphAsync_maps_subnet_nsg_onto_vnet_when_subnet_row_missing()
    {
        Guid vnetRow = Guid.Parse("44444444-1111-4000-8000-000000000001");
        Guid nsgRow = Guid.Parse("44444444-1111-4000-8000-000000000002");
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";
        const string nsgArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-app";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/app";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                CreateResource(nsgRow, nsgArmId, "Microsoft.Network/networkSecurityGroups"),
            ],
            [],
            [
                CreateRelationship(
                    subnetArmId,
                    nsgArmId,
                    GraphEdgeTypes.AppliesTo,
                    GraphEdgeInferenceSources.InventorySubnetNsg),
            ]);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventorySubnetNsg);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, DiagramMode.FullSubscription);
        ast.Edges.Where(edge => !edge.IsLayoutOnly).Should().NotBeEmpty();
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

    private static AzureInventoryResourceRecord CreateResource(
        Guid resourceRowId,
        string azureResourceId,
        string resourceType)
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

    private static AzureInventoryResourceRelationshipReadModel CreateRelationship(
        string fromArmId,
        string toArmId,
        string relationshipType,
        string inferenceSource)
    {
        return new AzureInventoryResourceRelationshipReadModel
        {
            FromAzureResourceId = fromArmId,
            ToAzureResourceId = toArmId,
            RelationshipType = relationshipType,
            InferenceSource = inferenceSource,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };
    }
}
