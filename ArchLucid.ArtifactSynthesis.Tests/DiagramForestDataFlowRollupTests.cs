using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

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
}
