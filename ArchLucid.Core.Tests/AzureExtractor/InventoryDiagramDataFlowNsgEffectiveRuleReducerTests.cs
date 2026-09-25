using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowNsgEffectiveRuleReducerTests
{
    private const string SourceSubnetArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/source";

    private const string TargetSubnetArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/target";

    private const string SourceAppArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/source-app";

    private const string TargetAppArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/target-app";

    private const string SourceNsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-source";

    private const string TargetNsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-target";

    [Fact]
    public void Reduce_matching_source_and_destination_allow_rules_displays_tcp_443()
    {
        GraphSnapshot graph = BuildGraph(
            sourceRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.IsBlocked.Should().BeFalse();
        annotation.ConnectorDisplayLabels.Should().ContainSingle(label => label == "TCP 443");
    }

    [Fact]
    public void Reduce_overlapping_allow_rules_displays_one_effective_result_and_supporting_rule_references()
    {
        GraphSnapshot graph = BuildGraph(
            sourceRules: [],
            targetRules:
            [
                CreateRule("allow-https-a", "TCP", "443", "Inbound", "Allow", "100"),
                CreateRule("allow-https-b", "TCP", "443", "Inbound", "Allow", "200"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().ContainSingle(label => label == "Inbound TCP 443");
        annotation.SupportingRuleDetailLines.Should().HaveCount(2);
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-https-a", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-https-b", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_deny_on_either_side_marks_connector_blocked()
    {
        GraphSnapshot graph = BuildGraph(
            sourceRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "200"),
            ],
            targetRules:
            [
                CreateRule("deny-https-in", "TCP", "443", "Inbound", "Deny", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.IsBlocked.Should().BeTrue();
        annotation.ConnectorDisplayLabels.Should().Contain("blocked");
    }

    [Fact]
    public void Reduce_different_inbound_and_outbound_results_produce_two_directional_annotations()
    {
        GraphSnapshot graph = BuildGraph(
            sourceRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-http-in", "TCP", "80", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().BeEquivalentTo(["Outbound TCP 443", "Inbound TCP 80"]);
    }

    [Fact]
    public void AttachmentIndex_resolves_subnet_nsg_for_app_node()
    {
        GraphSnapshot graph = BuildGraph(
            sourceRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        Dictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> index =
            InventoryDiagramDataFlowNsgAttachmentIndex.Build(graph);

        index.Should().ContainKey(SourceSubnetArmId.ToLowerInvariant());
        index.Should().ContainKey(TargetSubnetArmId.ToLowerInvariant());

        GraphNode sourceApp = graph.Nodes.Single(node => node.NodeId == "source-app-node");
        InventoryDiagramDataFlowNsgAttachmentIndex.ResolveSubnetArmIdForGraphNode(graph, sourceApp)
            .Should()
            .Be(SourceSubnetArmId.ToLowerInvariant());
        IReadOnlyList<InventoryDiagramDataFlowNsgEndpointAttachment> sourceAttachments =
            InventoryDiagramDataFlowNsgAttachmentIndex.ResolveEndpointAttachments(graph, sourceApp, index);

        sourceAttachments.Should().ContainSingle();
        sourceAttachments[0].Rules.Should().ContainSingle(rule => rule.Direction == "Outbound");
    }

    [Fact]
    public void Reduce_without_applicable_nsg_returns_no_annotation()
    {
        GraphSnapshot graph = BuildGraphWithoutNsg();

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().BeNull();
    }

    private static GraphSnapshot BuildGraph(
        IReadOnlyList<AzureInventoryNsgSecurityRule> sourceRules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> targetRules)
    {
        GraphNode sourceSubnet = CreateSubnetNode("source-subnet-node", SourceSubnetArmId);
        GraphNode targetSubnet = CreateSubnetNode("target-subnet-node", TargetSubnetArmId);
        GraphNode sourceApp = CreateAppNode("source-app-node", SourceAppArmId);
        GraphNode targetApp = CreateAppNode("target-app-node", TargetAppArmId);

        List<GraphNode> nodes = [sourceSubnet, targetSubnet, sourceApp, targetApp];
        List<GraphEdge> edges =
        [
            CreateEdge("source-app-node", "source-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
            CreateEdge("target-app-node", "target-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
        ];

        if (sourceRules.Count > 0)
        {
            nodes.Add(CreateNsgNode("source-nsg-node", SourceNsgArmId, SourceSubnetArmId, sourceRules));
        }

        if (targetRules.Count > 0)
        {
            nodes.Add(CreateNsgNode("target-nsg-node", TargetNsgArmId, TargetSubnetArmId, targetRules));
        }

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildGraphWithoutNsg()
    {
        GraphNode sourceSubnet = CreateSubnetNode("source-subnet-node", SourceSubnetArmId);
        GraphNode targetSubnet = CreateSubnetNode("target-subnet-node", TargetSubnetArmId);
        GraphNode sourceApp = CreateAppNode("source-app-node", SourceAppArmId);
        GraphNode targetApp = CreateAppNode("target-app-node", TargetAppArmId);

        List<GraphEdge> edges =
        [
            CreateEdge("source-app-node", "source-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
            CreateEdge("target-app-node", "target-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
        ];

        return CreateGraph([sourceSubnet, targetSubnet, sourceApp, targetApp], edges);
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
                [$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix}"] =
                    subnetArmId,
                [$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix}"] =
                    AzureInventoryNsgAssociationParser.SubnetKind,
            },
        };

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

    private static GraphEdge CreateEdge(string fromNodeId, string toNodeId, string edgeType)
    {
        return new GraphEdge
        {
            EdgeId = $"edge-{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1,
            InferenceSource = edgeType,
        };
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
