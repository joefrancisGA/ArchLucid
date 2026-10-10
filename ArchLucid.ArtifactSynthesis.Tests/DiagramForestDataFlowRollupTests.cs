using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DiagramForestDataFlowRollupTests
{
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
                ["in 443/TCP · Internet", "in 444/TCP · Internet", "in 445/TCP · Internet", "+1"],
                options => options.WithStrictOrdering());
        rollup.NsgInboundRuleChips.Single(chip => chip.Text == "in 443/TCP · Internet").IsRisky.Should().BeTrue();
    }
}
