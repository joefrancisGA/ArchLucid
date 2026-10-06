using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class InventoryDiagramLoadBalancerBackendRelationshipApplierTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_load_balancer_draws_sends_traffic_to_virtual_machine()
    {
        GraphSnapshot graph = BuildLoadBalancerVmGraph(includeBackendMember: true, includeRulePort: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramEdge edge = FindLoadBalancerToVmEdge(ast);
        edge.Label.Should().Be(InventoryDiagramRelationshipLabelTexts.SendsTrafficTo);
    }

    [Fact]
    public void Compile_load_balancer_includes_rule_port_when_stored()
    {
        GraphSnapshot graph = BuildLoadBalancerVmGraph(includeBackendMember: true, includeRulePort: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        FindLoadBalancerToVmEdge(ast).Label.Should().Be("Sends traffic to 443");
    }

    [Fact]
    public void Compile_load_balancer_without_rule_port_omits_port_on_line()
    {
        GraphSnapshot graph = BuildLoadBalancerVmGraph(includeBackendMember: true, includeRulePort: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        FindLoadBalancerToVmEdge(ast).Label.Should().Be(InventoryDiagramRelationshipLabelTexts.SendsTrafficTo);
    }

    [Fact]
    public void Compile_application_gateway_uses_sends_traffic_to_label()
    {
        GraphSnapshot graph = BuildApplicationGatewayAppGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        string agwId = ast.Nodes.Single(node => node.Label == "agw-app").NodeId;
        string appId = ast.Nodes.Single(node => node.Label == "web-app").NodeId;
        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly
            && edge.FromNodeId == agwId
            && edge.ToNodeId == appId
            && edge.Label == InventoryDiagramRelationshipLabelTexts.SendsTrafficTo);
    }

    [Fact]
    public void Compile_empty_pool_draws_no_backend_line()
    {
        GraphSnapshot graph = BuildLoadBalancerVmGraph(includeBackendMember: false, includeRulePort: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        string lbId = ast.Nodes.Single(node => node.Label == "lb-app").NodeId;
        string vmId = ast.Nodes.Single(node => node.Label == "vm-app").NodeId;
        ast.Edges.Should().NotContain(edge =>
            !edge.IsLayoutOnly && edge.FromNodeId == lbId && edge.ToNodeId == vmId);
    }

    private static DiagramEdge FindLoadBalancerToVmEdge(DiagramAst ast)
    {
        string lbId = ast.Nodes.Single(node => node.Label == "lb-app").NodeId;
        string vmId = ast.Nodes.Single(node => node.Label == "vm-app").NodeId;

        return ast.Edges.Should().ContainSingle(edge =>
                !edge.IsLayoutOnly
                && edge.FromNodeId == lbId
                && edge.ToNodeId == vmId)
            .Subject;
    }

    private static GraphSnapshot BuildLoadBalancerVmGraph(bool includeBackendMember, bool includeRulePort)
    {
        const string lbArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb-app";
        const string poolArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb-app/backendAddressPools/pool";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-app/ipConfigurations/ipconfig";
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicResourceArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-app";

        GraphNode lb = CreateNode("lb", lbArmId, "Microsoft.Network/loadBalancers", "lb-app");
        string backendConfigurations = includeBackendMember
            ? $"[{{\"id\":\"{nicArmId}\"}}]"
            : "[]";
        lb.Properties["backendAddressPools"] =
            $"[{{\"id\":\"{poolArmId}\",\"properties\":{{\"backendIPConfigurations\":{backendConfigurations}}}}}]";

        if (includeRulePort)
        {
            lb.Properties["loadBalancingRules"] =
                $"[{{\"properties\":{{\"backendAddressPool\":{{\"id\":\"{poolArmId}\"}},\"backendPort\":443}}}}]";
        }

        return new GraphSnapshot
        {
            Nodes =
            [
                lb,
                CreateNode("vm", vmArmId, "Microsoft.Compute/virtualMachines", "vm-app"),
                CreateNode("nic", nicResourceArmId, "Microsoft.Network/networkInterfaces", "nic-app"),
            ],
            Edges =
            [
                CreateEdge("vm-nic", "vm", "nic", AzureInventoryRelationshipAssociationTypes.VmToNic, GraphEdgeInferenceSources.InventoryVmNic),
            ],
        };
    }

    private static GraphSnapshot BuildApplicationGatewayAppGraph()
    {
        const string agwArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/applicationGateways/agw-app";
        const string appArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/web-app";

        GraphNode agw = CreateNode("agw", agwArmId, "Microsoft.Network/applicationGateways", "agw-app");
        agw.Properties["backendAddressPools"] =
            "[{\"properties\":{\"backendAddresses\":[{\"properties\":{\"backendResourceId\":\"" + appArmId + "\"}}]}}]";

        return new GraphSnapshot
        {
            Nodes =
            [
                agw,
                CreateNode("app", appArmId, "Microsoft.Web/sites", "web-app"),
            ],
        };
    }

    private static GraphNode CreateNode(string nodeId, string armId, string armType, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg",
            },
        };
    }

    private static GraphEdge CreateEdge(
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
