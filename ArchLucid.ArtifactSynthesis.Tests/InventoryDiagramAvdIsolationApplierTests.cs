using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramAvdIsolationApplierTests
{
    private const string HostPoolArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool";

    private const string WorkspaceArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/workspaces/ws";

    private const string ApplicationGroupArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/applicationGroups/ag";

    private const string SessionHostArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/host1";

    private const string AvdOnlyVmArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01";

    private const string DualRoleVmArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/shared01";

    private const string FirewallArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw";

    private const string SharedStorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/shared";

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_full_subscription_omits_avd_internal_resources()
    {
        GraphSnapshot graph = BuildAvdTopologyGraph(includeDualRoleVm: false, includeFirewallEdge: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceId == HostPoolArmId);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == WorkspaceArmId);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == ApplicationGroupArmId);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == SessionHostArmId);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == AvdOnlyVmArmId);
    }

    [Fact]
    public void Compile_avd_mode_includes_internal_resources_and_edges()
    {
        GraphSnapshot graph = BuildAvdTopologyGraph(includeDualRoleVm: false, includeFirewallEdge: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Avd);

        ast.Nodes.Should().Contain(node => node.ArmResourceId == HostPoolArmId);
        ast.Nodes.Should().Contain(node => node.ArmResourceId == WorkspaceArmId);
        ast.Nodes.Should().Contain(node => node.ArmResourceId == ApplicationGroupArmId);
        ast.Nodes.Should().Contain(node => node.ArmResourceId == SessionHostArmId);
        ast.Nodes.Should().Contain(node => node.ArmResourceId == AvdOnlyVmArmId);
        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryAvdSessionHostToVm);
    }

    [Fact]
    public void Compile_full_subscription_keeps_dual_role_vm()
    {
        GraphSnapshot graph = BuildAvdTopologyGraph(includeDualRoleVm: true, includeFirewallEdge: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.ArmResourceId == DualRoleVmArmId);
    }

    [Fact]
    public void Compile_data_flow_omits_avd_only_session_host_vm()
    {
        GraphSnapshot graph = BuildAvdTopologyGraph(includeDualRoleVm: false, includeFirewallEdge: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Nodes.Should().NotContain(node => node.ArmResourceId == AvdOnlyVmArmId);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == HostPoolArmId);
    }

    [Fact]
    public void Compile_full_subscription_emits_collapsed_boundary_for_shared_firewall_edge()
    {
        GraphSnapshot graph = BuildAvdTopologyGraph(includeDualRoleVm: false, includeFirewallEdge: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.IsAvdCollapsedBoundary);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == HostPoolArmId);
        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && ast.Nodes.Single(node => node.IsAvdCollapsedBoundary).NodeId == edge.FromNodeId
            && ast.Nodes.Any(node => node.ArmResourceId == FirewallArmId && node.NodeId == edge.ToNodeId));
    }

    private static GraphSnapshot BuildAvdTopologyGraph(bool includeDualRoleVm, bool includeFirewallEdge)
    {
        List<GraphNode> nodes =
        [
            CreateTopologyNode("host-pool-node", HostPoolArmId, "Microsoft.DesktopVirtualization/hostPools"),
            CreateTopologyNode("workspace-node", WorkspaceArmId, "Microsoft.DesktopVirtualization/workspaces"),
            CreateTopologyNode("app-group-node", ApplicationGroupArmId, "Microsoft.DesktopVirtualization/applicationGroups"),
            CreateTopologyNode("session-host-node", SessionHostArmId, "Microsoft.DesktopVirtualization/hostPools/sessionHosts"),
            CreateTopologyNode("avd-vm-node", AvdOnlyVmArmId, "Microsoft.Compute/virtualMachines"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("workspace-node", "app-group-node", GraphEdgeTypes.Contains),
            CreateEdge("app-group-node", "host-pool-node", GraphEdgeTypes.Contains),
            CreateEdge("session-host-node", "avd-vm-node", GraphEdgeTypes.ConnectsTo, GraphEdgeInferenceSources.InventoryAvdSessionHostToVm),
        ];

        if (includeDualRoleVm)
        {
            nodes.Add(CreateTopologyNode("dual-role-vm-node", DualRoleVmArmId, "Microsoft.Compute/virtualMachines"));
            nodes.Add(CreateTopologyNode("shared-storage-node", SharedStorageArmId, "Microsoft.Storage/storageAccounts"));
            edges.Add(CreateEdge("session-host-node", "dual-role-vm-node", GraphEdgeTypes.ConnectsTo, GraphEdgeInferenceSources.InventoryAvdSessionHostToVm));
            edges.Add(CreateEdge("dual-role-vm-node", "shared-storage-node", GraphEdgeTypes.ConnectsTo, GraphEdgeInferenceSources.InventoryObservedDependency));
        }

        if (includeFirewallEdge)
        {
            nodes.Add(CreateTopologyNode("firewall-node", FirewallArmId, "Microsoft.Network/azureFirewalls"));
            edges.Add(CreateEdge("host-pool-node", "firewall-node", GraphEdgeTypes.ConnectsTo, GraphEdgeInferenceSources.InventoryFirewallSubnet));
        }

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot CreateGraph(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
        };
    }

    private static GraphEdge CreateEdge(
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string? inferenceSource = null)
    {
        return new GraphEdge
        {
            EdgeId = $"edge-{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1.0d,
            InferenceSource = inferenceSource,
        };
    }

    private static GraphNode CreateTopologyNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = MermaidIdSanitizer.Sanitize(armId),
            Category = "compute",
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
}
