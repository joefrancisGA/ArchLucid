using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidCompletenessSummaryBuilderTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Build_network_mode_includes_nicToSubnet_when_snapshot_warns()
    {
        DiagramAst ast = compiler.Compile(
            BuildVmNicSubnetGraph(),
            DiagramMode.Network,
            new DiagramAstCompileOptions());

        InfraEvidenceMermaidCompletenessSummary summary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "network",
            ast,
            [AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing])!;

        summary.MissingClasses.Should().Contain("nicToSubnet");
    }

    [Fact]
    public void Build_identity_mode_omits_nicToSubnet_warning()
    {
        DiagramAst ast = compiler.Compile(
            BuildVmNicSubnetGraph(),
            DiagramMode.Identity,
            new DiagramAstCompileOptions());

        InfraEvidenceMermaidCompletenessSummary summary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "identity",
            ast,
            [
                AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing,
                AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing,
            ])!;

        summary.MissingClasses.Should().NotContain("nicToSubnet");
        summary.MissingClasses.Should().Contain("logicAppConnections");
    }

    [Fact]
    public void Build_full_subscription_counts_hidden_hops_from_composed_edges()
    {
        DiagramAst ast = compiler.Compile(
            BuildVmNicSubnetGraph(),
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludePrivateEndpointNodes = false });

        InfraEvidenceMermaidCompletenessSummary summary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "full",
            ast,
            [])!;

        summary.HiddenHopsUsedCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Build_data_flow_mode_surfaces_logic_app_missing_class()
    {
        DiagramAst ast = compiler.Compile(
            BuildVmNicSubnetGraph(),
            DiagramMode.DataFlow,
            new DiagramAstCompileOptions());

        InfraEvidenceMermaidCompletenessSummary networkSummary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "network",
            ast,
            [AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing])!;
        InfraEvidenceMermaidCompletenessSummary dataFlowSummary = InfraEvidenceMermaidCompletenessSummaryBuilder.Build(
            "dataFlow",
            ast,
            [AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing])!;

        networkSummary.MissingClasses.Should().NotContain("logicAppConnections");
        dataFlowSummary.MissingClasses.Should().Contain("logicAppConnections");
    }

    private static GraphSnapshot BuildVmNicSubnetGraph()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string vnetArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet";
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(Node("vnet-1", "core-vnet", "Microsoft.Network/virtualNetworks", "network-rg", GraphTopologyCategories.Network));
        graph.Nodes.Add(Node(
            "subnet-1",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg",
            GraphTopologyCategories.Network,
            vnetArmId));
        graph.Nodes.Add(Node("nic-1", "app-nic", "Microsoft.Network/networkInterfaces", "network-rg", GraphTopologyCategories.Network));
        graph.Nodes.Add(Node("vm-1", "app-vm", "Microsoft.Compute/virtualMachines", "compute-rg", GraphTopologyCategories.Compute));

        graph.Edges.Add(Edge("vm-1", "nic-1", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(Edge("nic-1", "subnet-1", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(Edge("subnet-1", "vnet-1", GraphEdgeTypes.Contains));

        return graph;
    }

    private static GraphNode Node(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string category,
        string? parentVnetArmId = null)
    {
        string armId = $"/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/{resourceGroup}/providers/{armType}/{label}";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = resourceGroup,
            ["arm.subscriptionId"] = "11111111-1111-1111-1111-111111111111",
            ["arm.region"] = "eastus",
        };

        if (!string.IsNullOrWhiteSpace(parentVnetArmId))
        {
            properties["arm.parentId"] = $"{parentVnetArmId}/subnets/{label}";
        }

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = properties,
        };
    }

    private static GraphEdge Edge(string from, string to, string associationType)
    {
        return new GraphEdge
        {
            EdgeId = $"{from}-{to}",
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = associationType,
            Weight = 1d,
            InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
        };
    }
}
