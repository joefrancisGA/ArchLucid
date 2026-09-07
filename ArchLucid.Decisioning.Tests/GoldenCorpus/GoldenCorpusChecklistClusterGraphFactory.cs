using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>DX-22 golden graph — six declaration HTTPS gaps for checklist-cluster synthesis fixtures.</summary>
internal static class GoldenCorpusChecklistClusterGraphFactory
{
    internal static GraphSnapshot CreateSixHttpsDeclarationClusterGraph()
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];

        for (int index = 1; index <= 6; index++)
        {
            nodes.Add(
                new GraphNode
                {
                    NodeId = $"obj-storage-{index}",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = $"docs-{index}",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["tf.public_network_access"] = "enabled",
                    },
                });
        }

        return WrapCaseGraph(caseNumber: 46, nodes, edges);
    }

    private static GraphSnapshot WrapCaseGraph(
        int caseNumber,
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        string caseHex = caseNumber.ToString("D2", System.Globalization.CultureInfo.InvariantCulture);

        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse($"000000{caseHex}-0000-4000-8000-0000000000{caseHex}"),
            ContextSnapshotId = Guid.Parse($"10000000-0000-4000-8000-0000000000{caseHex}"),
            RunId = Guid.Parse($"20000000-0000-4000-8000-0000000000{caseHex}"),
            CreatedUtc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc),
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
            Warnings = [],
        };
    }
}
