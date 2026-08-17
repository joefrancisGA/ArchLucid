using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FsCheck;

namespace ArchLucid.Decisioning.Tests.Topology;

/// <summary>Small FsCheck graphs for topology analyzer metamorphic properties.</summary>
public sealed class TopologyAnalyzerMetamorphicGraphArbitrary
{
    public const int MaxNodeCount = 4;
    public const int MaxEdgeCount = 6;

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
                NodeId = "n" + i,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "label" + i,
                Category = compute ? GraphTopologyCategories.Compute : GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
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
                    FromNodeId = "n" + fromIndex,
                    ToNodeId = "n" + toIndex,
                    EdgeType = GraphEdgeTypes.ConnectsTo
                });
            }
        }

        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse("00000000-0000-0000-0000-000000000010"),
            ContextSnapshotId = Guid.Parse("00000000-0000-0000-0000-000000000011"),
            RunId = Guid.Parse("00000000-0000-0000-0000-000000000012"),
            CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            Nodes = nodes,
            Edges = edges,
            Warnings = []
        };
    }
}
