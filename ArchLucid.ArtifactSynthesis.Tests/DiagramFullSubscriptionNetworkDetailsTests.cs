using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramFullSubscriptionNetworkDetailsTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_full_subscription_hides_network_details_nics_and_subnets()
    {
        DiagramAst ast = compiler.Compile(BuildNetworkDetailGraph(), DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label == "pip-app");
        ast.Nodes.Should().NotContain(node => node.Label == "nsg-app");
        ast.Nodes.Should().NotContain(node => node.Label == "rt-app");
        ast.Nodes.Should().NotContain(node => node.Label == "pe-app");
        ast.Nodes.Should().NotContain(node => node.Label == "nic-app");
        ast.Nodes.Should().NotContain(node => node.Label == "subnet-app");
        ast.Nodes.Should().Contain(node => node.Label == "vm-app");
        ast.Nodes.Should().Contain(node => node.Label == "vnet-app");
    }

    [Fact]
    public void Compile_full_subscription_shows_network_details_and_still_hides_nics_and_subnets()
    {
        DiagramAst ast = compiler.Compile(
            BuildNetworkDetailGraph(),
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludeNetworkDetails = true });

        ast.Nodes.Should().Contain(node => node.Label == "pip-app");
        ast.Nodes.Should().Contain(node => node.Label == "nsg-app");
        ast.Nodes.Should().Contain(node => node.Label == "rt-app");
        ast.Nodes.Should().Contain(node => node.Label == "pe-app");
        ast.Nodes.Should().NotContain(node => node.Label == "nic-app");
        ast.Nodes.Should().NotContain(node => node.Label == "subnet-app");
    }

    [Fact]
    public void Compile_resource_group_shows_nics_subnets_and_network_details()
    {
        DiagramAst ast = compiler.Compile(
            BuildNetworkDetailGraph(),
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions { ResourceGroupName = "rg" });

        ast.Nodes.Should().Contain(node => node.Label == "nic-app");
        ast.Nodes.Should().Contain(node => node.Label == "subnet-app");
        ast.Nodes.Should().Contain(node => node.Label == "pip-app");
        ast.Nodes.Should().Contain(node => node.Label == "nsg-app");
        ast.Nodes.Should().Contain(node => node.Label == "rt-app");
        ast.Nodes.Should().Contain(node => node.Label == "pe-app");
    }

    [Fact]
    public void Compile_full_subscription_draws_one_line_from_virtual_machine_to_virtual_network()
    {
        DiagramAst ast = compiler.Compile(BuildVmNicSubnetVnetGraph(), DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label == "nic-app");
        ast.Nodes.Should().NotContain(node => node.Label == "subnet-app");
        CountLines(ast, "vm-app", "vnet-app").Should().Be(1);
    }

    [Fact]
    public void Compile_full_subscription_does_not_connect_a_virtual_machine_without_a_stored_path()
    {
        DiagramAst ast = compiler.Compile(BuildVmAndVnetGraph(), DiagramMode.FullSubscription);

        CountLines(ast, "vm-app", "vnet-app").Should().Be(0);
    }

    [Fact]
    public void Compile_full_subscription_does_not_shortcut_past_a_visible_public_ip()
    {
        DiagramAst ast = compiler.Compile(
            BuildLoadBalancerPublicIpGraph(),
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludeNetworkDetails = true });

        ast.Nodes.Should().Contain(node => node.Label == "pip-app");
        CountLines(ast, "lb-app", "pip-app").Should().Be(1);
    }

    [Fact]
    public void Compile_full_subscription_does_not_connect_a_key_vault_that_only_shares_a_resource_group()
    {
        DiagramAst ast = compiler.Compile(BuildVmAndKeyVaultGraph(), DiagramMode.FullSubscription);

        CountLines(ast, "vm-app", "kv-app").Should().Be(0);
    }

    private static int CountLines(DiagramAst ast, string fromLabel, string toLabel)
    {
        HashSet<string> fromIds = ast.Nodes
            .Where(node => node.Label == fromLabel)
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> toIds = ast.Nodes
            .Where(node => node.Label == toLabel)
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        return ast.Edges.Count(edge =>
            !edge.IsLayoutOnly
            && ((fromIds.Contains(edge.FromNodeId) && toIds.Contains(edge.ToNodeId))
                || (fromIds.Contains(edge.ToNodeId) && toIds.Contains(edge.FromNodeId))));
    }

    private static GraphSnapshot BuildNetworkDetailGraph()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                Node("vm", "vm-app", "Microsoft.Compute/virtualMachines"),
                Node("vnet", "vnet-app", "Microsoft.Network/virtualNetworks"),
                Node("nic", "nic-app", "Microsoft.Network/networkInterfaces"),
                Node("subnet", "subnet-app", "Microsoft.Network/virtualNetworks/subnets"),
                Node("pip", "pip-app", "Microsoft.Network/publicIPAddresses"),
                Node("nsg", "nsg-app", "Microsoft.Network/networkSecurityGroups"),
                Node("rt", "rt-app", "Microsoft.Network/routeTables"),
                Node("pe", "pe-app", "Microsoft.Network/privateEndpoints"),
            ],
        };
    }

    private static GraphSnapshot BuildVmNicSubnetVnetGraph()
    {
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/subnet-app";

        return new GraphSnapshot
        {
            Nodes =
            [
                Node("vm", "vm-app", "Microsoft.Compute/virtualMachines"),
                Node("nic", "nic-app", "Microsoft.Network/networkInterfaces"),
                Node("subnet", "subnet-app", "Microsoft.Network/virtualNetworks/subnets", subnetArmId),
                Node("vnet", "vnet-app", "Microsoft.Network/virtualNetworks"),
            ],
            Edges =
            [
                Edge("vm-nic", "vm", "nic", AzureInventoryRelationshipAssociationTypes.VmToNic, GraphEdgeInferenceSources.InventoryVmNic),
                Edge("nic-subnet", "nic", "subnet", AzureInventoryRelationshipAssociationTypes.NicToSubnet, GraphEdgeInferenceSources.InventoryNicSubnet),
            ],
        };
    }

    private static GraphSnapshot BuildVmAndVnetGraph()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                Node("vm", "vm-app", "Microsoft.Compute/virtualMachines"),
                Node("vnet", "vnet-app", "Microsoft.Network/virtualNetworks"),
            ],
        };
    }

    private static GraphSnapshot BuildLoadBalancerPublicIpGraph()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                Node("lb", "lb-app", "Microsoft.Network/loadBalancers"),
                Node("pip", "pip-app", "Microsoft.Network/publicIPAddresses"),
            ],
            Edges =
            [
                Edge("pip-lb", "pip", "lb", GraphEdgeTypes.Exposes, GraphEdgeInferenceSources.InventoryPublicIp),
            ],
        };
    }

    private static GraphSnapshot BuildVmAndKeyVaultGraph()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                Node("vm", "vm-app", "Microsoft.Compute/virtualMachines"),
                Node("kv", "kv-app", "Microsoft.KeyVault/vaults"),
            ],
        };
    }

    private static GraphNode Node(string nodeId, string label, string armType, string? armId = null)
    {
        string resolvedArmId = armId
            ?? $"/subscriptions/sub/resourceGroups/rg/providers/{armType}/{label}";
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "azure-inventory-snapshot",
            SourceId = resolvedArmId,
        };
        node.Properties["arm.id"] = resolvedArmId;
        node.Properties["arm.type"] = armType;
        node.Properties["arm.resourceGroup"] = "rg";

        return node;
    }

    private static GraphEdge Edge(
        string edgeId,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource)
    {
        return new GraphEdge
        {
            EdgeId = edgeId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            InferenceSource = inferenceSource,
            Weight = 1.0d,
        };
    }
}
