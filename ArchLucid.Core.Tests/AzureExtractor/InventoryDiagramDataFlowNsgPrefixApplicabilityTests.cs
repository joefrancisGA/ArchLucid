using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowNsgPrefixApplicabilityTests
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
    public void Reduce_higher_priority_deny_with_non_matching_destination_cidr_does_not_block_connector()
    {
        GraphSnapshot graph = BuildGraph(
            sourceSubnetPrefix: "10.0.1.0/24",
            targetSubnetPrefix: "10.0.2.0/24",
            sourceRules:
            [
                CreateRule(
                    "deny-other-subnet",
                    "TCP",
                    "443",
                    "Outbound",
                    "Deny",
                    "100",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "10.0.9.0/24"),
                CreateRule(
                    "allow-https-out",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "200",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "*"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.IsBlocked.Should().BeFalse();
        annotation.ConnectorDisplayLabels.Should().NotContain("blocked");
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-https-out", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line => line.Contains("deny-other-subnet", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_higher_priority_allow_with_non_matching_source_cidr_yields_lower_priority_applicable_rule()
    {
        GraphSnapshot graph = BuildGraph(
            sourceSubnetPrefix: "10.0.1.0/24",
            targetSubnetPrefix: "10.0.2.0/24",
            sourceRules:
            [
                CreateRule(
                    "allow-wrong-source",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "100",
                    sourceAddressPrefix: "10.0.9.0/24",
                    destinationAddressPrefix: "*"),
                CreateRule(
                    "allow-https-out",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "200",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "*"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().ContainSingle(label => label == "TCP 443");
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-https-out", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line => line.Contains("allow-wrong-source", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_matching_cidr_for_known_peer_address_becomes_effective_rule()
    {
        GraphSnapshot graph = BuildGraph(
            sourceSubnetPrefix: "10.0.1.0/24",
            targetSubnetPrefix: "10.0.2.0/24",
            sourceRules:
            [
                CreateRule(
                    "allow-to-target-subnet",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "100",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "10.0.2.0/24"),
            ],
            targetRules:
            [
                CreateRule(
                    "allow-from-source-subnet",
                    "TCP",
                    "443",
                    "Inbound",
                    "Allow",
                    "100",
                    sourceAddressPrefix: "10.0.1.0/24",
                    destinationAddressPrefix: "*"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().ContainSingle(label => label == "TCP 443");
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-to-target-subnet", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-from-source-subnet", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_specific_prefix_without_known_endpoint_address_is_skipped()
    {
        GraphSnapshot graph = BuildGraph(
            sourceSubnetPrefix: null,
            targetSubnetPrefix: null,
            sourceRules:
            [
                CreateRule(
                    "allow-specific-source",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "100",
                    sourceAddressPrefix: "10.0.1.0/24",
                    destinationAddressPrefix: "*"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().NotContain(label => label.Contains("Outbound", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line => line.Contains("allow-specific-source", StringComparison.Ordinal));
        annotation.ConnectorDisplayLabels.Should().Contain(label => label.Contains("Inbound TCP 443", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_virtual_network_service_tag_does_not_become_effective_rule()
    {
        GraphSnapshot graph = BuildGraph(
            sourceSubnetPrefix: "10.0.1.0/24",
            targetSubnetPrefix: "10.0.2.0/24",
            sourceRules:
            [
                CreateRule(
                    "allow-vnet-only",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "100",
                    sourceAddressPrefix: "*",
                    destinationAddressPrefix: "VirtualNetwork"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().NotContain(label => label.Contains("Outbound", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line => line.Contains("allow-vnet-only", StringComparison.Ordinal));
        annotation.ConnectorDisplayLabels.Should().Contain(label => label.Contains("Inbound TCP 443", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_array_only_prefixes_are_tested_per_entry_not_as_wildcard()
    {
        GraphSnapshot graph = BuildGraph(
            sourceSubnetPrefix: "10.0.1.0/24",
            targetSubnetPrefix: "10.0.2.0/24",
            sourceRules:
            [
                CreateRuleWithSourcePrefixes(
                    "allow-array-only",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "100",
                    sourceAddressPrefixes: ["10.0.9.0/24", "10.0.1.0/24"]),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().Contain(label => label.Contains("TCP 443", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-array-only", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_array_of_only_service_tags_does_not_become_effective_rule()
    {
        GraphSnapshot graph = BuildGraph(
            sourceSubnetPrefix: "10.0.1.0/24",
            targetSubnetPrefix: "10.0.2.0/24",
            sourceRules:
            [
                CreateRuleWithSourcePrefixes(
                    "allow-service-tags-only",
                    "TCP",
                    "443",
                    "Outbound",
                    "Allow",
                    "100",
                    sourceAddressPrefixes: ["VirtualNetwork", "Internet"]),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "source-app-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().NotContain(label => label.Contains("Outbound", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line => line.Contains("allow-service-tags-only", StringComparison.Ordinal));
    }

    private static GraphSnapshot BuildGraph(
        string? sourceSubnetPrefix,
        string? targetSubnetPrefix,
        IReadOnlyList<AzureInventoryNsgSecurityRule> sourceRules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> targetRules)
    {
        GraphNode sourceSubnet = CreateSubnetNode("source-subnet-node", SourceSubnetArmId, sourceSubnetPrefix);
        GraphNode targetSubnet = CreateSubnetNode("target-subnet-node", TargetSubnetArmId, targetSubnetPrefix);
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

    private static GraphNode CreateSubnetNode(string nodeId, string armId, string? addressPrefix)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = "Microsoft.Network/virtualNetworks/subnets",
            ["arm.resourceGroup"] = "rg",
        };

        if (!string.IsNullOrWhiteSpace(addressPrefix))
        {
            properties["addressPrefix"] = addressPrefix;
        }

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armId[(armId.LastIndexOf('/') + 1)..],
            Category = "network",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = properties,
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

        AddNsgRules(nsgNode, rules);
        return nsgNode;
    }

    private static void AddNsgRules(GraphNode nsgNode, IReadOnlyList<AzureInventoryNsgSecurityRule> rules)
    {
        bool requiresJson = rules.Any(rule =>
            rule.SourceAddressPrefixes.Count > 0 || rule.DestinationAddressPrefixes.Count > 0);

        if (requiresJson)
        {
            nsgNode.Properties["securityRules"] = BuildSecurityRulesJson(rules);
            return;
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

            if (!string.IsNullOrWhiteSpace(rule.SourceAddressPrefix))
            {
                nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleSourceAddressPrefixSuffix}"] =
                    rule.SourceAddressPrefix;
            }

            if (!string.IsNullOrWhiteSpace(rule.DestinationAddressPrefix))
            {
                nsgNode.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationAddressPrefixSuffix}"] =
                    rule.DestinationAddressPrefix;
            }
        }
    }

    private static string BuildSecurityRulesJson(IReadOnlyList<AzureInventoryNsgSecurityRule> rules)
    {
        List<string> serializedRules = [];

        foreach (AzureInventoryNsgSecurityRule rule in rules)
        {
            List<string> properties =
            [
                $"\"protocol\":\"{rule.Protocol}\"",
                $"\"destinationPortRange\":\"{rule.DestinationPortRange}\"",
                $"\"direction\":\"{rule.Direction}\"",
                $"\"access\":\"{rule.Access}\"",
                $"\"priority\":{rule.Priority}",
            ];

            if (!string.IsNullOrWhiteSpace(rule.SourceAddressPrefix))
            {
                properties.Add($"\"sourceAddressPrefix\":\"{rule.SourceAddressPrefix}\"");
            }

            if (!string.IsNullOrWhiteSpace(rule.DestinationAddressPrefix))
            {
                properties.Add($"\"destinationAddressPrefix\":\"{rule.DestinationAddressPrefix}\"");
            }

            if (rule.SourceAddressPrefixes.Count > 0)
            {
                properties.Add(
                    "\"sourceAddressPrefixes\":"
                    + System.Text.Json.JsonSerializer.Serialize(rule.SourceAddressPrefixes));
            }

            if (rule.DestinationAddressPrefixes.Count > 0)
            {
                properties.Add(
                    "\"destinationAddressPrefixes\":"
                    + System.Text.Json.JsonSerializer.Serialize(rule.DestinationAddressPrefixes));
            }

            serializedRules.Add(
                "{\"name\":\"" + rule.RuleName + "\",\"properties\":{" + string.Join(",", properties) + "}}");
        }

        return $"[{string.Join(",", serializedRules)}]";
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
        string priority,
        string? sourceAddressPrefix = null,
        string? destinationAddressPrefix = null)
    {
        return new AzureInventoryNsgSecurityRule
        {
            RuleName = ruleName,
            Protocol = protocol,
            DestinationPortRange = destinationPort,
            Direction = direction,
            Access = access,
            Priority = priority,
            SourceAddressPrefix = sourceAddressPrefix,
            DestinationAddressPrefix = destinationAddressPrefix,
        };
    }

    private static AzureInventoryNsgSecurityRule CreateRuleWithSourcePrefixes(
        string ruleName,
        string protocol,
        string destinationPort,
        string direction,
        string access,
        string priority,
        IReadOnlyList<string> sourceAddressPrefixes)
    {
        return new AzureInventoryNsgSecurityRule
        {
            RuleName = ruleName,
            Protocol = protocol,
            DestinationPortRange = destinationPort,
            Direction = direction,
            Access = access,
            Priority = priority,
            SourceAddressPrefixes = sourceAddressPrefixes,
        };
    }
}
