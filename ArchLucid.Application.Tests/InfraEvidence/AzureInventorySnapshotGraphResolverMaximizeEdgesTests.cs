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
public sealed class AzureInventorySnapshotGraphResolverMaximizeEdgesTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_connects_logic_apps_to_web_connections_in_the_same_resource_group()
    {
        Guid workflowRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid connectionRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        const string workflowArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/la-notify";
        const string connectionArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(workflowRow, workflowArmId, "Microsoft.Logic/workflows"),
                    CreateResource(connectionRow, connectionArmId, "Microsoft.Web/connections"),
                ],
                [],
                []));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryLogicAppConnection);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, DiagramMode.FullSubscription);
        ast.Edges.Where(edge => !edge.IsLayoutOnly).Should().NotBeEmpty();
        ast.Nodes.Should().Contain(node => node.Label == "la-notify");
        ast.Nodes.Should().Contain(node => node.Label == "office365");
    }

    [Fact]
    public async Task TryResolveGraphAsync_places_virtual_machines_in_the_only_vnet_in_the_resource_group()
    {
        Guid vmRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid vnetRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(vmRow, vmArmId, "Microsoft.Compute/virtualMachines"),
                    CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                ],
                [],
                []));

        result.Succeeded.Should().BeTrue();

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph!, DiagramMode.FullSubscription);
        DiagramEdge? inVnet = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .SingleOrDefault(edge => string.Equals(edge.Label, "in", StringComparison.OrdinalIgnoreCase));
        inVnet.Should().NotBeNull();
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inVnet!.FromNodeId && node.Label == "vm-app");
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inVnet!.ToNodeId && node.Label == "vnet-app");
    }

    [Fact]
    public async Task TryResolveGraphAsync_connects_data_factory_to_storage_in_the_same_resource_group()
    {
        Guid adfRow = Guid.Parse("33333333-1111-4000-8000-000000000001");
        Guid storageRow = Guid.Parse("33333333-1111-4000-8000-000000000002");
        const string adfArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw";
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stedw";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(adfRow, adfArmId, "Microsoft.DataFactory/factories"),
                    CreateResource(storageRow, storageArmId, "Microsoft.Storage/storageAccounts"),
                ],
                [],
                []));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred);
    }

    [Fact]
    public async Task TryResolveGraphAsync_emits_edge_from_property_value_arm_id()
    {
        Guid appRow = Guid.Parse("44444444-1111-4000-8000-000000000001");
        Guid kvRow = Guid.Parse("44444444-1111-4000-8000-000000000002");
        const string appArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-edw";
        const string kvArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-edw";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(appRow, appArmId, "Microsoft.Web/sites", "app-rg"),
                    CreateResource(kvRow, kvArmId, "Microsoft.KeyVault/vaults", "kv-rg"),
                ],
                [
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = appRow,
                        PropertyKey = "siteConfig.appSettings[0].value",
                        PropertyValue = kvArmId,
                    },
                ],
                []));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryResourceGroupCollocation);
    }

    [Fact]
    public async Task TryResolveGraphAsync_connects_nsg_to_the_only_vnet_in_the_resource_group()
    {
        Guid vnetRow = Guid.Parse("55555555-1111-4000-8000-000000000001");
        Guid nsgRow = Guid.Parse("55555555-1111-4000-8000-000000000002");
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";
        const string nsgArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-app";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                    CreateResource(nsgRow, nsgArmId, "Microsoft.Network/networkSecurityGroups"),
                ],
                [],
                []));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventorySubnetNsg);
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
        string resourceType,
        string resourceGroup = "rg")
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = resourceGroup,
            SubscriptionId = "sub",
        };
    }
}
