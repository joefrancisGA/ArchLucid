using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FsCheck;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
///     FsCheck generator for small well-typed <see cref="GraphSnapshot" /> values used by merge property tests.
///     Node ids, labels, and source ids are unique so endpoint-key collisions are not generated as illegal types.
/// </summary>
public static class GraphSnapshotArbitrary
{
    public const int MaxNodeCount = 6;
    public const int MaxEdgeCount = 8;

    public static Arbitrary<GraphSnapshot> Graphs()
    {
        return GraphGen().ToArbitrary();
    }

    internal static Gen<GraphSnapshot> GraphGen()
    {
        return from nodeCount in Gen.Choose(0, MaxNodeCount)
               from extraEdges in Gen.Choose(0, MaxEdgeCount)
               select BuildGraph(nodeCount, extraEdges);
    }

    internal static GraphSnapshot BuildGraph(int nodeCount, int extraEdges)
    {
        List<GraphNode> nodes = [];

        for (int i = 0; i < nodeCount; i++)
        {
            bool compute = i % 2 == 0;

            nodes.Add(new GraphNode
            {
                NodeId = NodeId(i),
                NodeType = GraphNodeTypes.TopologyResource,
                Label = NodeLabel(i),
                Category = compute ? GraphTopologyCategories.Compute : GraphTopologyCategories.Data,
                SourceType = AgentTopologyProposalTestGraph.TerraformSourceType,
                SourceId = NodeSourceId(i)
            });
        }

        List<GraphEdge> edges = [];

        if (nodeCount >= 2)
        {
            int maxDirected = nodeCount * (nodeCount - 1);
            int edgeCount = Math.Min(extraEdges, Math.Min(MaxEdgeCount, maxDirected));

            for (int e = 0; e < edgeCount; e++)
            {
                int fromIndex = e % nodeCount;
                int toIndex = (fromIndex + 1 + (e / nodeCount)) % nodeCount;

                if (toIndex == fromIndex)
                    toIndex = (fromIndex + 1) % nodeCount;

                edges.Add(new GraphEdge
                {
                    EdgeId = "e" + e,
                    FromNodeId = NodeId(fromIndex),
                    ToNodeId = NodeId(toIndex),
                    EdgeType = GraphEdgeTypes.ConnectsTo
                });
            }
        }

        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            ContextSnapshotId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            RunId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            Nodes = nodes,
            Edges = edges,
            Warnings = []
        };
    }

    internal static string NodeId(int index) => "n" + index;

    internal static string NodeLabel(int index) => "label" + index;

    internal static string NodeSourceId(int index) => "src" + index;
}
