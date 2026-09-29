using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramBackboneKeepFilterTests
{
    [Fact]
    public void Filter_keeps_vms_and_sql_databases_and_drops_nsgs()
    {
        DiagramPeelCatalogSnapshot catalog = DiagramPeelCatalogDefaultSeed.BuildSnapshot();
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateNode("vm-1", "Microsoft.Compute/virtualMachines"),
                CreateNode("db-1", "Microsoft.Sql/servers/databases"),
                CreateNode("nsg-1", "Microsoft.Network/networkSecurityGroups"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "vm-1",
                    ToNodeId = "db-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                },
                new GraphEdge
                {
                    EdgeId = "e2",
                    FromNodeId = "vm-1",
                    ToNodeId = "nsg-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                },
            ],
        };

        GraphSnapshot filtered = InventoryDiagramBackboneKeepFilter.Filter(graph, catalog);

        filtered.Nodes.Select(node => node.NodeId).Should().BeEquivalentTo(["vm-1", "db-1"]);
        filtered.Edges.Should().ContainSingle(edge =>
            string.Equals(edge.FromNodeId, "vm-1", StringComparison.Ordinal)
            && string.Equals(edge.ToNodeId, "db-1", StringComparison.Ordinal));
    }

    [Fact]
    public void Filter_projects_cross_group_vm_placement_before_dropping_subnet()
    {
        const string vnetArmId =
            "/subscriptions/s/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/hub";
        const string subnetArmId = $"{vnetArmId}/subnets/app";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateNode("vnet", "Microsoft.Network/virtualNetworks", vnetArmId, "rg-network"),
                CreateNode("subnet", "Microsoft.Network/virtualNetworks/subnets", subnetArmId, "rg-network"),
                CreateNode(
                    "vm",
                    "Microsoft.Compute/virtualMachines",
                    "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/app",
                    "rg-app"),
                CreateNode(
                    "nic",
                    "Microsoft.Network/networkInterfaces",
                    "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/networkInterfaces/app",
                    "rg-app"),
                CreateNode(
                    "key-vault",
                    "Microsoft.KeyVault/vaults",
                    "/subscriptions/s/resourceGroups/rg-data/providers/Microsoft.KeyVault/vaults/app",
                    "rg-data"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "vm-nic",
                    FromNodeId = "vm",
                    ToNodeId = "nic",
                    EdgeType = AzureInventoryRelationshipAssociationTypes.VmToNic,
                    Weight = 1.0d,
                    InferenceSource = GraphEdgeInferenceSources.InventoryVmNic,
                },
                new GraphEdge
                {
                    EdgeId = "nic-subnet",
                    FromNodeId = "nic",
                    ToNodeId = "subnet",
                    EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                    Weight = 1.0d,
                    InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
                },
                new GraphEdge
                {
                    EdgeId = "key-vault-vnet",
                    FromNodeId = "key-vault",
                    ToNodeId = "vnet",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                },
            ],
        };

        GraphSnapshot filtered = InventoryDiagramBackboneKeepFilter.Filter(
            graph,
            DiagramPeelCatalogDefaultSeed.BuildSnapshot());

        filtered.Nodes.Select(node => node.NodeId)
            .Should()
            .BeEquivalentTo(["vnet", "vm", "key-vault"]);
        filtered.Edges.Should().Contain(edge =>
            edge.FromNodeId == "vm"
            && edge.ToNodeId == "vnet"
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement
            && edge.Weight == 1.0d);
        filtered.Edges.Should().Contain(edge =>
            edge.FromNodeId == "key-vault"
            && edge.ToNodeId == "vnet"
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint);
        filtered.Edges.Should().NotContain(edge =>
            edge.FromNodeId == "key-vault"
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPeSubnet);
    }

    private static GraphNode CreateNode(
        string nodeId,
        string armType,
        string? armId = null,
        string? resourceGroup = null)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nodeId,
            SourceType = "azure-inventory-snapshot",
        };
        node.Properties["arm.type"] = armType;

        if (!string.IsNullOrWhiteSpace(armId))
        {
            node.Properties["arm.id"] = armId;
        }

        if (!string.IsNullOrWhiteSpace(resourceGroup))
        {
            node.Properties["arm.resourceGroup"] = resourceGroup;
        }

        return node;
    }
}
