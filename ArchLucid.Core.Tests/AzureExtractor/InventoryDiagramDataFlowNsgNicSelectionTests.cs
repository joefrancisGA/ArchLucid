using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowNsgNicSelectionTests
{
    private const string VmArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-multi";

    private const string Nic1ArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-1";

    private const string Nic2ArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-2";

    private const string SubnetAArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/subnet-a";

    private const string SubnetBArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/subnet-b";

    private const string SubnetCArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/subnet-c";

    private const string TargetAppArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/target-app";

    private const string Nic1NsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-nic-1";

    private const string Nic2NsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-nic-2";

    private const string SubnetBNsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-subnet-b";

    [Fact]
    public void Reduce_single_nic_vm_applies_that_nic_nsg()
    {
        GraphSnapshot graph = BuildSingleNicVmGraph(
            nicRules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "vm-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().Contain(label => label.Contains("TCP 443", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().Contain(line =>
            line.Contains("allow-https-out", StringComparison.Ordinal)
            && line.Contains(AzureInventoryNsgAssociationParser.NicKind, StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_multi_nic_vm_applies_only_facing_nic_nsg()
    {
        GraphSnapshot graph = BuildDualNicVmGraph(
            nic1Rules:
            [
                CreateRule("allow-http-out", "TCP", "80", "Outbound", "Allow", "100"),
            ],
            nic2Rules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ],
            targetSubnetArmId: SubnetBArmId);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "vm-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().Contain(label => label.Contains("TCP 443", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().Contain(line => line.Contains("allow-https-out", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line => line.Contains("allow-http-out", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_multi_nic_vm_other_nic_deny_does_not_block_connector()
    {
        GraphSnapshot graph = BuildDualNicVmGraph(
            nic1Rules:
            [
                CreateRule("deny-all-out", "TCP", "*", "Outbound", "Deny", "100"),
            ],
            nic2Rules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ],
            targetSubnetArmId: SubnetBArmId);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "vm-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.IsBlocked.Should().BeFalse();
        annotation.ConnectorDisplayLabels.Should().NotContain("blocked");
        annotation.SupportingRuleDetailLines.Should().NotContain(line => line.Contains("deny-all-out", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_multi_nic_vm_two_nics_on_peer_subnet_applies_no_nic_nsg()
    {
        GraphSnapshot graph = BuildDualNicBothOnPeerSubnetGraph(
            nic1Rules:
            [
                CreateRule("allow-http-out", "TCP", "80", "Outbound", "Allow", "100"),
            ],
            nic2Rules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ]);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "vm-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().NotContain(label => label.Contains("Outbound", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line =>
            line.Contains(AzureInventoryNsgAssociationParser.NicKind, StringComparison.Ordinal));
        annotation.ConnectorDisplayLabels.Should().Contain(label => label.Contains("Inbound TCP 443", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_multi_nic_vm_without_facing_nic_applies_no_nic_nsg_but_peer_subnet_nsg_still_annotates()
    {
        GraphSnapshot graph = BuildDualNicVmGraph(
            nic1Rules:
            [
                CreateRule("allow-http-out", "TCP", "80", "Outbound", "Allow", "100"),
            ],
            nic2Rules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ],
            targetSubnetArmId: SubnetCArmId);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "vm-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().NotContain(label => label.Contains("Outbound", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().NotContain(line =>
            line.Contains(AzureInventoryNsgAssociationParser.NicKind, StringComparison.Ordinal));
        annotation.ConnectorDisplayLabels.Should().Contain(label => label.Contains("Inbound TCP 443", StringComparison.Ordinal));
    }

    [Fact]
    public void Reduce_multi_nic_vm_applies_subnet_nsg_on_selected_nic_subnet()
    {
        GraphSnapshot graph = BuildDualNicVmGraph(
            nic1Rules: [],
            nic2Rules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules:
            [
                CreateRule("allow-https-in", "TCP", "443", "Inbound", "Allow", "100"),
            ],
            targetSubnetArmId: SubnetBArmId,
            includeSubnetBNsg: true);

        InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
            InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, "vm-node", "target-app-node");

        annotation.Should().NotBeNull();
        annotation!.ConnectorDisplayLabels.Should().Contain(label => label.Contains("TCP 443", StringComparison.Ordinal));
        annotation.SupportingRuleDetailLines.Should().Contain(line =>
            line.Contains("allow-subnet-b-out", StringComparison.Ordinal)
            && line.Contains(AzureInventoryNsgAssociationParser.SubnetKind, StringComparison.Ordinal));
    }

    [Fact]
    public void AttachmentIndex_indexes_nic_nsg_under_nic_arm_id_not_vm_owner()
    {
        GraphSnapshot graph = BuildDualNicVmGraph(
            nic1Rules:
            [
                CreateRule("allow-http-out", "TCP", "80", "Outbound", "Allow", "100"),
            ],
            nic2Rules:
            [
                CreateRule("allow-https-out", "TCP", "443", "Outbound", "Allow", "100"),
            ],
            targetRules: [],
            targetSubnetArmId: SubnetBArmId);

        Dictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> index =
            InventoryDiagramDataFlowNsgAttachmentIndex.Build(graph);

        index.Should().ContainKey(Nic1ArmId.ToLowerInvariant());
        index.Should().ContainKey(Nic2ArmId.ToLowerInvariant());
        index.Should().NotContainKey(VmArmId.ToLowerInvariant());
    }

    private static GraphSnapshot BuildSingleNicVmGraph(
        IReadOnlyList<AzureInventoryNsgSecurityRule> nicRules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> targetRules)
    {
        GraphNode subnetA = CreateSubnetNode("subnet-a-node", SubnetAArmId);
        GraphNode nic1 = CreateNicNode("nic-1-node", Nic1ArmId);
        GraphNode vm = CreateVmNode("vm-node", VmArmId);
        GraphNode targetSubnet = CreateSubnetNode("target-subnet-node", SubnetBArmId);
        GraphNode targetApp = CreateAppNode("target-app-node", TargetAppArmId);

        List<GraphNode> nodes = [subnetA, nic1, vm, targetSubnet, targetApp];
        List<GraphEdge> edges =
        [
            CreateEdge("vm-node", "nic-1-node", AzureInventoryRelationshipAssociationTypes.VmToNic),
            CreateEdge("nic-1-node", "subnet-a-node", AzureInventoryRelationshipAssociationTypes.NicToSubnet),
            CreateEdge("target-app-node", "target-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
        ];

        if (nicRules.Count > 0)
        {
            nodes.Add(CreateNsgNodeForNic("nic1-nsg-node", Nic1NsgArmId, Nic1ArmId, nicRules));
        }

        if (targetRules.Count > 0)
        {
            nodes.Add(CreateNsgNode("target-nsg-node", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-target", SubnetBArmId, targetRules));
        }

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildDualNicBothOnPeerSubnetGraph(
        IReadOnlyList<AzureInventoryNsgSecurityRule> nic1Rules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> nic2Rules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> targetRules)
    {
        GraphNode subnetB = CreateSubnetNode("subnet-b-node", SubnetBArmId);
        GraphNode nic1 = CreateNicNode("nic-1-node", Nic1ArmId);
        GraphNode nic2 = CreateNicNode("nic-2-node", Nic2ArmId);
        GraphNode vm = CreateVmNode("vm-node", VmArmId);
        GraphNode targetApp = CreateAppNode("target-app-node", TargetAppArmId);

        List<GraphNode> nodes = [subnetB, nic1, nic2, vm, targetApp];
        List<GraphEdge> edges =
        [
            CreateEdge("vm-node", "nic-1-node", AzureInventoryRelationshipAssociationTypes.VmToNic),
            CreateEdge("vm-node", "nic-2-node", AzureInventoryRelationshipAssociationTypes.VmToNic),
            CreateEdge("nic-1-node", "subnet-b-node", AzureInventoryRelationshipAssociationTypes.NicToSubnet),
            CreateEdge("nic-2-node", "subnet-b-node", AzureInventoryRelationshipAssociationTypes.NicToSubnet),
            CreateEdge("target-app-node", "subnet-b-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
        ];

        if (nic1Rules.Count > 0)
        {
            nodes.Add(CreateNsgNodeForNic("nic1-nsg-node", Nic1NsgArmId, Nic1ArmId, nic1Rules));
        }

        if (nic2Rules.Count > 0)
        {
            nodes.Add(CreateNsgNodeForNic("nic2-nsg-node", Nic2NsgArmId, Nic2ArmId, nic2Rules));
        }

        if (targetRules.Count > 0)
        {
            nodes.Add(CreateNsgNode(
                "target-nsg-node",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-target",
                SubnetBArmId,
                targetRules));
        }

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildDualNicVmGraph(
        IReadOnlyList<AzureInventoryNsgSecurityRule> nic1Rules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> nic2Rules,
        IReadOnlyList<AzureInventoryNsgSecurityRule> targetRules,
        string targetSubnetArmId,
        bool includeSubnetBNsg = false)
    {
        GraphNode subnetA = CreateSubnetNode("subnet-a-node", SubnetAArmId);
        GraphNode subnetB = CreateSubnetNode("subnet-b-node", SubnetBArmId);
        GraphNode subnetC = CreateSubnetNode("subnet-c-node", SubnetCArmId);
        GraphNode nic1 = CreateNicNode("nic-1-node", Nic1ArmId);
        GraphNode nic2 = CreateNicNode("nic-2-node", Nic2ArmId);
        GraphNode vm = CreateVmNode("vm-node", VmArmId);
        GraphNode targetSubnet = CreateSubnetNode("target-subnet-node", targetSubnetArmId);
        GraphNode targetApp = CreateAppNode("target-app-node", TargetAppArmId);

        List<GraphNode> nodes = [subnetA, subnetB, subnetC, nic1, nic2, vm, targetSubnet, targetApp];
        List<GraphEdge> edges =
        [
            CreateEdge("vm-node", "nic-1-node", AzureInventoryRelationshipAssociationTypes.VmToNic),
            CreateEdge("vm-node", "nic-2-node", AzureInventoryRelationshipAssociationTypes.VmToNic),
            CreateEdge("nic-1-node", "subnet-a-node", AzureInventoryRelationshipAssociationTypes.NicToSubnet),
            CreateEdge("nic-2-node", "subnet-b-node", AzureInventoryRelationshipAssociationTypes.NicToSubnet),
            CreateEdge("target-app-node", "target-subnet-node", AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
        ];

        if (nic1Rules.Count > 0)
        {
            nodes.Add(CreateNsgNodeForNic("nic1-nsg-node", Nic1NsgArmId, Nic1ArmId, nic1Rules));
        }

        if (nic2Rules.Count > 0)
        {
            nodes.Add(CreateNsgNodeForNic("nic2-nsg-node", Nic2NsgArmId, Nic2ArmId, nic2Rules));
        }

        if (includeSubnetBNsg)
        {
            nodes.Add(CreateNsgNode(
                "subnet-b-nsg-node",
                SubnetBNsgArmId,
                SubnetBArmId,
                [
                    CreateRule("allow-subnet-b-out", "TCP", "443", "Outbound", "Allow", "100"),
                ]));
        }

        if (targetRules.Count > 0)
        {
            nodes.Add(CreateNsgNode(
                "target-nsg-node",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-target",
                targetSubnetArmId,
                targetRules));
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

    private static GraphNode CreateNicNode(string nodeId, string armId)
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
                ["arm.type"] = "Microsoft.Network/networkInterfaces",
                ["arm.resourceGroup"] = "rg",
            },
        };
    }

    private static GraphNode CreateVmNode(string nodeId, string armId)
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
                ["arm.type"] = "Microsoft.Compute/virtualMachines",
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

        AddNsgRules(nsgNode, rules);
        return nsgNode;
    }

    private static GraphNode CreateNsgNodeForNic(
        string nodeId,
        string nsgArmId,
        string nicArmId,
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
                    nicArmId,
                [$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix}"] =
                    AzureInventoryNsgAssociationParser.NicKind,
            },
        };

        AddNsgRules(nsgNode, rules);
        return nsgNode;
    }

    private static void AddNsgRules(GraphNode nsgNode, IReadOnlyList<AzureInventoryNsgSecurityRule> rules)
    {
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
