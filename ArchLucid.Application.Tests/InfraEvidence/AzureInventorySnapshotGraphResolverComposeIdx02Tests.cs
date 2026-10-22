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
public sealed class AzureInventorySnapshotGraphResolverComposeIdx02Tests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    public static TheoryData<DiagramMode> Idx02DiagramModes { get; } = new(
        DiagramMode.Executive,
        DiagramMode.Architecture,
        DiagramMode.Network,
        DiagramMode.Security,
        DiagramMode.Identity,
        DiagramMode.Data,
        DiagramMode.DataFlow,
        DiagramMode.DataArchitecture,
        DiagramMode.FullSubscription,
        DiagramMode.ResourceGroup,
        DiagramMode.SelectedResources,
        DiagramMode.DependencyNeighborhood);

    [Theory]
    [MemberData(nameof(Idx02DiagramModes))]
    public async Task TryResolveGraphAsync_composed_vm_placement_survives_diagram_mode_compile(DiagramMode mode)
    {
        Guid vmRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid nicRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        Guid subnetRow = Guid.Parse("11111111-1111-4000-8000-000000000003");
        Guid vnetRow = Guid.Parse("11111111-1111-4000-8000-000000000004");
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";

        List<AzureInventoryResourceRelationshipReadModel> relationships =
        [
            CreateRelationship(vmArmId, nicArmId, GraphEdgeInferenceSources.InventoryVmNic),
            CreateRelationship(nicArmId, subnetArmId, GraphEdgeInferenceSources.InventoryNicSubnet),
        ];

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(vmRow, vmArmId, "Microsoft.Compute/virtualMachines"),
                    CreateResource(nicRow, nicArmId, "Microsoft.Network/networkInterfaces"),
                    CreateResource(subnetRow, subnetArmId, "Microsoft.Network/virtualNetworks/subnets"),
                    CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                ],
                [],
                relationships));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet
            && result.Graph.Nodes.Any(node =>
                node.NodeId == edge.FromNodeId && node.Label == "vm1"));

        GraphNode vmNode = result.Graph!.Nodes.Single(node => node.Label == "vm1");
        DiagramAstCompileOptions? options = mode switch
        {
            DiagramMode.ResourceGroup => new DiagramAstCompileOptions { ResourceGroupName = "rg" },
            DiagramMode.DependencyNeighborhood => new DiagramAstCompileOptions
            {
                NeighborhoodSeedNodeId = vmNode.NodeId,
            },
            _ => null,
        };

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, mode, options);

        bool expectsVmOnCanvas = mode is DiagramMode.Executive
            or DiagramMode.Architecture
            or DiagramMode.Network
            or DiagramMode.FullSubscription
            or DiagramMode.ResourceGroup
            or DiagramMode.DependencyNeighborhood;

        bool expectsPlacementEdge = mode is DiagramMode.Executive
            or DiagramMode.Architecture
            or DiagramMode.Network
            or DiagramMode.FullSubscription
            or DiagramMode.ResourceGroup;

        if (expectsVmOnCanvas)
        {
            ast.Nodes.Should().Contain(node => node.Label == "vm1");
        }

        if (expectsPlacementEdge)
        {
            ast.Edges
                .Where(edge => !edge.IsLayoutOnly)
                .Should()
                .Contain(edge => string.Equals(edge.Label, "in", StringComparison.OrdinalIgnoreCase));
        }

        if (!expectsVmOnCanvas)
        {
            ast.Nodes.Should().NotContain(node => node.Label == "vm1");
        }
    }

    [Fact]
    public async Task TryResolveGraphAsync_composes_owner_to_vnet_when_subnet_node_exists()
    {
        Guid vmRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid nicRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        Guid subnetRow = Guid.Parse("22222222-1111-4000-8000-000000000003");
        Guid vnetRow = Guid.Parse("22222222-1111-4000-8000-000000000004");
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(vmRow, vmArmId, "Microsoft.Compute/virtualMachines"),
                    CreateResource(nicRow, nicArmId, "Microsoft.Network/networkInterfaces"),
                    CreateResource(subnetRow, subnetArmId, "Microsoft.Network/virtualNetworks/subnets"),
                    CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                ],
                [],
                [
                    CreateRelationship(vmArmId, nicArmId, GraphEdgeInferenceSources.InventoryVmNic),
                    CreateRelationship(nicArmId, subnetArmId, GraphEdgeInferenceSources.InventoryNicSubnet),
                ]));

        result.Succeeded.Should().BeTrue();
        GraphNode? vmNode = result.Graph!.Nodes.Single(node => node.Label == "vm-app");
        GraphNode? vnetNode = result.Graph.Nodes.Single(node => node.Label == "vnet1");
        result.Graph.Edges.Should().Contain(edge =>
            edge.FromNodeId == vmNode.NodeId
            && edge.ToNodeId == vnetNode.NodeId
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet);
    }

    private static AzureInventoryResourceRelationshipReadModel CreateRelationship(
        string fromArmId,
        string toArmId,
        string inferenceSource)
    {
        return new AzureInventoryResourceRelationshipReadModel
        {
            FromAzureResourceId = ArmResourceIdNormalizer.Normalize(fromArmId),
            ToAzureResourceId = ArmResourceIdNormalizer.Normalize(toArmId),
            RelationshipType = GraphEdgeTypes.ConnectsTo,
            InferenceSource = inferenceSource,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };
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
