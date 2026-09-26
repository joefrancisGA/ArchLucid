using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowNsgAnnotationApplierTests
{
    private const string SourceAppArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/source-app";

    private const string TargetAppArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/target-app";

    private const string SourceSubnetArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/source";

    private const string TargetSubnetArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/target";

    private const string SourceNsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-source";

    private const string TargetNsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-target";

    private const string NsgOnlyArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-only";

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_data_flow_connector_displays_matching_tcp_443_annotation()
    {
        GraphSnapshot graph = BuildAnnotatedFlowGraph(
            includeSourceNsg: true,
            includeTargetNsg: true,
            sourceRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        DiagramEdge edge = FindAppToAppEdge(ast);
        edge.DataFlowNsgAnnotationLabels.Should().ContainSingle(label => label == "TCP 443");
        edge.Label.Should().Contain("TCP 443");
        edge.IsDataFlowNsgBlocked.Should().BeFalse();
    }

    [Fact]
    public void Compile_data_flow_connector_without_applicable_nsg_has_no_annotation()
    {
        GraphSnapshot graph = BuildAnnotatedFlowGraph(
            includeSourceNsg: false,
            includeTargetNsg: false,
            sourceRules: [],
            targetRules: []);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        DiagramEdge edge = FindAppToAppEdge(ast);
        edge.DataFlowNsgAnnotationLabels.Should().BeEmpty();
        edge.DataFlowNsgSupportingRuleDetails.Should().BeEmpty();
        edge.IsDataFlowNsgBlocked.Should().BeFalse();
    }

    [Fact]
    public void Compile_data_flow_diagram_still_contains_no_nsg_node()
    {
        GraphSnapshot graph = BuildAnnotatedFlowGraph(
            includeSourceNsg: true,
            includeTargetNsg: true,
            sourceRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ],
            includeStandaloneNsgNode: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Nodes.Should().NotContain(node => node.ArmResourceId == NsgOnlyArmId);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == SourceNsgArmId);
        ast.Nodes.Should().NotContain(node => node.ArmResourceId == TargetNsgArmId);
    }

    [Fact]
    public void Compile_data_flow_connector_marks_blocked_when_destination_nsg_denies()
    {
        GraphSnapshot graph = BuildAnnotatedFlowGraph(
            includeSourceNsg: true,
            includeTargetNsg: true,
            sourceRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "200"),
            ],
            targetRules:
            [
                CreateRule("deny-https-in", "TCP", "443", "Inbound", "Deny", "100"),
            ]);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        DiagramEdge edge = FindAppToAppEdge(ast);
        edge.IsDataFlowNsgBlocked.Should().BeTrue();
        edge.DataFlowNsgAnnotationLabels.Should().Contain("blocked");
    }

    private static DiagramEdge FindAppToAppEdge(DiagramAst ast)
    {
        string sourceAppId = ast.Nodes.Single(node => node.ArmResourceId == SourceAppArmId).NodeId;
        string targetAppId = ast.Nodes.Single(node => node.ArmResourceId == TargetAppArmId).NodeId;

        return ast.Edges.Should().ContainSingle(edge =>
                !edge.IsLayoutOnly
                && edge.FromNodeId == sourceAppId
                && edge.ToNodeId == targetAppId)
            .Subject;
    }

    private static GraphSnapshot BuildAnnotatedFlowGraph(
        bool includeSourceNsg,
        bool includeTargetNsg,
        IReadOnlyList<AzureInventoryNsgSecurityRule> sourceRules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> targetRules,
        bool includeStandaloneNsgNode = false)
    {
        GraphNode sourceSubnet = CreateSubnetNode("source-subnet-node", SourceSubnetArmId);
        GraphNode targetSubnet = CreateSubnetNode("target-subnet-node", TargetSubnetArmId);
        GraphNode sourceApp = CreateAppNode("source-app-node", SourceAppArmId);
        GraphNode targetApp = CreateAppNode("target-app-node", TargetAppArmId);

        List<GraphNode> nodes = [sourceSubnet, targetSubnet, sourceApp, targetApp];
        List<GraphEdge> edges =
        [
            CreateDataFlowEdge("source-app-node", "target-app-node"),
            CreateEdge("source-app-node", "source-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
            CreateEdge("target-app-node", "target-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
        ];

        if (includeSourceNsg)
        {
            nodes.Add(CreateNsgNode("source-nsg-node", SourceNsgArmId, SourceSubnetArmId, sourceRules));
        }

        if (includeTargetNsg)
        {
            nodes.Add(CreateNsgNode("target-nsg-node", TargetNsgArmId, TargetSubnetArmId, targetRules));
        }

        if (includeStandaloneNsgNode)
        {
            nodes.Add(CreateNsgNode("nsg-only-node", NsgOnlyArmId, string.Empty, []));
        }

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot CreateGraph(IReadOnlyList<GraphNode> nodes, IReadOnlyList<GraphEdge> edges)
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

    private static GraphEdge CreateDataFlowEdge(string fromNodeId, string toNodeId)
    {
        return new GraphEdge
        {
            EdgeId = $"edge-{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
            Label = AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
            Weight = 1,
            InferenceSource = GraphEdgeInferenceSources.InventoryPeReachableTarget,
        };
    }

    private static GraphEdge CreateEdge(string fromNodeId, string toNodeId, string edgeType)
    {
        return new GraphEdge
        {
            EdgeId = $"edge-{fromNodeId}-{toNodeId}-assoc",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1,
            InferenceSource = edgeType,
        };
    }

    private static GraphNode CreateSubnetNode(string nodeId, string armId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armId[(armId.LastIndexOf('/') + 1)..],
            Category = "network",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = "Microsoft.Network/virtualNetworks/subnets",
                ["arm.resourceGroup"] = "rg",
            },
        };
    }

    private static GraphNode CreateAppNode(string nodeId, string armId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armId[(armId.LastIndexOf('/') + 1)..],
            Category = "compute",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = "Microsoft.Web/sites",
                ["arm.resourceGroup"] = "rg",
            },
        };
    }

    private static GraphNode CreateNsgNode(
        string nodeId,
        string nsgArmId,
        string subnetArmId,
        IReadOnlyList<AzureInventoryNsgSecurityRule> rules)
    {
        GraphNode nsgNode = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nsgArmId[(nsgArmId.LastIndexOf('/') + 1)..],
            Category = "network",
            SourceType = "azure-inventory-snapshot",
            SourceId = nsgArmId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = nsgArmId,
                ["arm.type"] = "Microsoft.Network/networkSecurityGroups",
                ["arm.resourceGroup"] = "rg",
            },
        };

        if (!string.IsNullOrWhiteSpace(subnetArmId))
        {
            nsgNode.Properties[
                    $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix}"] =
                subnetArmId;
            nsgNode.Properties[
                    $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix}"] =
                AzureInventoryNsgAssociationParser.SubnetKind;
        }

        for (int index = 0; index < rules.Count; index++)
        {
            AzureInventoryNsgSecurityRule rule = rules[index];
            string prefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}{index}";

            nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleNameSuffix}"] =
                rule.RuleName ?? string.Empty;
            nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleProtocolSuffix}"] =
                rule.Protocol ?? string.Empty;
            nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationPortRangeSuffix}"] =
                rule.DestinationPortRange ?? string.Empty;
            nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDirectionSuffix}"] =
                rule.Direction ?? string.Empty;
            nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleAccessSuffix}"] =
                rule.Access ?? string.Empty;
            nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrioritySuffix}"] =
                rule.Priority ?? string.Empty;
        }

        return nsgNode;
    }

    private static AzureInventoryNsgSecurityRule CreateRule(
        string ruleName,
        string protocol,
        string destinationPort,
        string direction,
        string access,
        string priority)
    {
        return new AzureInventoryNsgSecurityRule
        {
            RuleName = ruleName,
            Protocol = protocol,
            DestinationPortRange = destinationPort,
            Direction = direction,
            Access = access,
            Priority = priority,
        };
    }
}
