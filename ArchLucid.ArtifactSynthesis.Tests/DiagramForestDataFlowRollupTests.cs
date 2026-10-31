using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestDataFlowRollupTests
{
    [Fact]
    public void Apply_uses_explicit_label_when_type_caption_is_missing()
    {
        const string consumerId = "consumer-app";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"node-{index}",
                Label = $"node-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "source",
                OrderKey = index,
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "app",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"node-{index}",
                ToNodeId = consumerId,
                Label = "uses",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.Label.Should().Contain("resource type was not stored");
        rollup.Label.Should().NotContain("storeds");
        rollup.Label.Should().Be("4 resources; resource type was not stored");
    }

    [Fact]
    public void Apply_rollup_member_line_includes_resource_group_omission_when_missing()
    {
        const string consumerId = "consumer-app";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"node-{index}",
                Label = $"node-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "source",
                OrderKey = index,
                ArmResourceType = "Microsoft.Storage/storageAccounts",
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "app",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"node-{index}",
                ToNodeId = consumerId,
                Label = "uses",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.DataFlowRollupMemberNames.Should().OnlyContain(name => name.Contains("Resource group was not stored."));
    }

    [Fact]
    public void Apply_preserves_separate_cards_for_in_stage_hub_spoke_star()
    {
        const string stageId = "ingest";
        const string factoryId = "adf";
        List<DiagramNode> nodes =
        [
            new DiagramNode
            {
                NodeId = factoryId,
                Label = factoryId,
                NodeType = "TopologyResource",
                SubgraphId = stageId,
                OrderKey = 0,
                ArmResourceType = "Microsoft.DataFactory/factories",
            },
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"st{index}",
                Label = $"st{index}",
                NodeType = "TopologyResource",
                SubgraphId = stageId,
                OrderKey = index + 1,
                ArmResourceType = "Microsoft.Storage/storageAccounts",
            }),
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = factoryId,
                ToNodeId = $"st{index}",
                Label = "writes",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        result.Nodes.Should().NotContain(node => node.IsDataFlowRollup);
        result.Nodes.Should().HaveCount(5);
    }

    [Fact]
    public void Apply_merges_parallel_rolled_up_edges_nsg_annotations_from_all_members()
    {
        const string consumerId = "consumer-app";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"storage-{index}",
                Label = $"storage-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "storage",
                OrderKey = index,
                ArmResourceType = "Microsoft.Storage/storageAccounts",
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "app",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"storage-{index}",
                ToNodeId = consumerId,
                Label = "uses",
                IsDataFlowNsgBlocked = index % 2 == 0,
                DataFlowNsgAnnotationLabels = [$"rule-{index}"],
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramEdge? rollupEdge = result.Edges
            .SingleOrDefault(edge => edge.ToNodeId == consumerId || edge.FromNodeId == consumerId);
        rollupEdge.Should().NotBeNull();
        rollupEdge!.DataFlowNsgAnnotationLabels
            .Should()
            .BeEquivalentTo(["rule-0", "rule-1", "rule-2", "rule-3"]);
        rollupEdge.IsDataFlowNsgBlocked.Should().BeTrue("any member edge blocked should surface on merged edge");
    }

    [Fact]
    public void Apply_rollup_node_lists_all_distinct_external_target_hosts()
    {
        const string consumerId = "consumer-app";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"mysql-link-{index}",
                Label = $"mysql-link-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "source",
                OrderKey = index,
                ExternalLinkedServiceType = "AzureMySql",
                ExternalFactoryName = $"adf-factory-{index}",
                ExternalTargetHost = $"mysql-{index}.partner.example",
                ExternalIntegrationRuntime = index % 2 == 0 ? "managed" : "selfHostedIr",
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "application",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"mysql-link-{index}",
                ToNodeId = consumerId,
                Label = "reads",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.ExternalTargetHosts
            .Should()
            .BeEquivalentTo(
                [
                    "mysql-0.partner.example",
                    "mysql-1.partner.example",
                    "mysql-2.partner.example",
                    "mysql-3.partner.example",
                ],
                options => options.WithStrictOrdering());
        rollup.ExternalTargetHost.Should().BeNull("multiple distinct hosts should not collapse to the first member only");
        rollup.ExternalIntegrationRuntimes
            .Should()
            .BeEquivalentTo(["managed", "selfHostedIr"], options => options.WithStrictOrdering());
        rollup.ExternalIntegrationRuntime.Should().BeNull();
    }

    [Fact]
    public void Apply_rollup_node_surfaces_key_vault_when_any_member_stores_host_in_key_vault()
    {
        const string consumerId = "consumer-app";
        List<DiagramNode> nodes =
        [
            new DiagramNode
            {
                NodeId = "mysql-link-0",
                Label = "mysql-link-0",
                NodeType = "TopologyResource",
                SubgraphId = "source",
                OrderKey = 0,
                ExternalLinkedServiceType = "AzureMySql",
                ExternalFactoryName = "adf-factory-0",
                ExternalTargetHost = "mysql-0.partner.example",
            },
            ..Enumerable.Range(1, 3).Select(index => new DiagramNode
            {
                NodeId = $"mysql-link-{index}",
                Label = $"mysql-link-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "source",
                OrderKey = index,
                ExternalLinkedServiceType = "AzureMySql",
                ExternalFactoryName = $"adf-factory-{index}",
                ExternalHostInKeyVault = true,
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "application",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"mysql-link-{index}",
                ToNodeId = consumerId,
                Label = "reads",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.ExternalHostInKeyVault.Should().BeTrue("any member with Key Vault host should surface on the rollup card");
    }

    [Fact]
    public void Apply_rollup_node_merges_nsg_inbound_rule_chips_from_all_members()
    {
        const string consumerId = "consumer-app";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"storage-{index}",
                Label = $"storage-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "storage",
                OrderKey = index,
                ArmResourceType = "Microsoft.Storage/storageAccounts",
                NsgInboundRuleChips =
                [
                    new DiagramNsgInboundRuleChip($"in {443 + index}/TCP · Internet", index == 0),
                ],
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "app",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"storage-{index}",
                ToNodeId = consumerId,
                Label = "uses",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.NsgInboundRuleChips.Select(chip => chip.Text)
            .Should()
            .BeEquivalentTo(
                [
                    "in 443/TCP · Internet",
                    "in 444/TCP · Internet",
                    "in 445/TCP · Internet",
                    "1 more inbound rules were not listed on this card.",
                ],
                options => options.WithStrictOrdering());
        rollup.NsgInboundRuleChips.Single(chip => chip.Text == "in 443/TCP · Internet").IsRisky.Should().BeTrue();
    }

    [Fact]
    public void Apply_source_stage_rolls_up_same_connector_type_even_when_neighbors_differ()
    {
        const string sourceStageId = "data-arch-source";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"sftp-{index}",
                Label = $"sftp-{index}",
                NodeType = "TopologyResource",
                SubgraphId = sourceStageId,
                OrderKey = index,
                ExternalLinkedServiceType = "Sftp",
            }),
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"consumer-{index}",
                Label = $"consumer-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "data-arch-integration",
                OrderKey = index + 10,
                ArmResourceType = "Microsoft.DataFactory/factories",
            }),
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"sftp-{index}",
                ToNodeId = $"consumer-{index}",
                Label = "reads",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.SubgraphId.Should().Be(sourceStageId);
        rollup.DataFlowRollupMemberIds.Should().HaveCount(4);
        rollup.DataFlowRollupMemberNames.Should().HaveCount(4);
    }

    [Fact]
    public void Apply_source_stage_keeps_three_same_type_cards_separate()
    {
        const string sourceStageId = "data-arch-source";
        const string consumerId = "consumer";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 3).Select(index => new DiagramNode
            {
                NodeId = $"sftp-{index}",
                Label = $"sftp-{index}",
                NodeType = "TopologyResource",
                SubgraphId = sourceStageId,
                OrderKey = index,
                ExternalLinkedServiceType = "Sftp",
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "data-arch-integration",
                OrderKey = 10,
                ArmResourceType = "Microsoft.DataFactory/factories",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 3).Select(index => new DiagramEdge
            {
                FromNodeId = $"sftp-{index}",
                ToNodeId = consumerId,
                Label = "reads",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        result.Nodes.Should().NotContain(node => node.IsDataFlowRollup);
        result.Nodes.Should().HaveCount(4);
    }

    [Fact]
    public void Apply_storage_stage_keeps_four_cards_with_different_neighbors_separate()
    {
        const string storageStageId = "data-arch-storage";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"storage-{index}",
                Label = $"storage-{index}",
                NodeType = "TopologyResource",
                SubgraphId = storageStageId,
                OrderKey = index,
                ArmResourceType = "Microsoft.Storage/storageAccounts",
            }),
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"consumer-{index}",
                Label = $"consumer-{index}",
                NodeType = "TopologyResource",
                SubgraphId = "data-arch-application",
                OrderKey = index + 10,
                ArmResourceType = "Microsoft.Web/sites",
            }),
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"storage-{index}",
                ToNodeId = $"consumer-{index}",
                Label = "uses",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        result.Nodes.Should().NotContain(node => node.IsDataFlowRollup);
        result.Nodes.Should().HaveCount(8);
    }

    [Fact]
    public void Apply_rollup_node_carries_single_hidden_public_ip_and_private_endpoint_name()
    {
        const string sourceStageId = "data-arch-storage";
        const string consumerId = "consumer";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"storage-{index}",
                Label = $"storage-{index}",
                NodeType = "TopologyResource",
                SubgraphId = sourceStageId,
                OrderKey = index,
                ArmResourceType = "Microsoft.Storage/storageAccounts",
                HasPublicInternetExposure = true,
                HiddenPublicIpAddress = "203.0.113.4",
                HasPrivateEndpointAccess = true,
                PrivateEndpointAccessName = "pe-storage",
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "data-arch-application",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"storage-{index}",
                ToNodeId = consumerId,
                Label = "uses",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.HiddenPublicIpAddress.Should().Be("203.0.113.4");
        rollup.PrivateEndpointAccessName.Should().Be("pe-storage");
        rollup.HasPublicInternetExposure.Should().BeTrue();
        rollup.HasPrivateEndpointAccess.Should().BeTrue();
    }

    [Fact]
    public void Apply_rollup_node_omits_conflicting_hidden_public_ips_and_private_endpoint_names()
    {
        const string sourceStageId = "data-arch-storage";
        const string consumerId = "consumer";
        List<DiagramNode> nodes =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramNode
            {
                NodeId = $"storage-{index}",
                Label = $"storage-{index}",
                NodeType = "TopologyResource",
                SubgraphId = sourceStageId,
                OrderKey = index,
                ArmResourceType = "Microsoft.Storage/storageAccounts",
                HasPublicInternetExposure = true,
                HiddenPublicIpAddress = index < 2 ? "203.0.113.4" : "203.0.113.5",
                HasPrivateEndpointAccess = true,
                PrivateEndpointAccessName = index < 2 ? "pe-a" : "pe-b",
            }),
            new DiagramNode
            {
                NodeId = consumerId,
                Label = consumerId,
                NodeType = "TopologyResource",
                SubgraphId = "data-arch-application",
                OrderKey = 10,
                ArmResourceType = "Microsoft.Web/sites",
            },
        ];
        List<DiagramEdge> edges =
        [
            ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
            {
                FromNodeId = $"storage-{index}",
                ToNodeId = consumerId,
                Label = "uses",
            }),
        ];

        DiagramForestDataFlowRollup.Result result = DiagramForestDataFlowRollup.Apply(nodes, edges);

        DiagramNode rollup = result.Nodes.Single(node => node.IsDataFlowRollup);
        rollup.RollupMultipleHiddenPublicIpAddresses.Should().BeTrue();
        rollup.RollupMultiplePrivateEndpointAccessNames.Should().BeTrue();
        DiagramNodeHumanCaptionFactory.Create(rollup).CombinedPlainText.Should()
            .Contain(InventoryDiagramRelationshipLabelTexts.MultipleHiddenPublicIpAddressesStored);
        DiagramNodeHumanCaptionFactory.Create(rollup).CombinedPlainText.Should()
            .Contain(DiagramForestPrivateEndpointEdgeAccessibility.MultiplePrivateEndpointAccessNamesStored);
    }
}
