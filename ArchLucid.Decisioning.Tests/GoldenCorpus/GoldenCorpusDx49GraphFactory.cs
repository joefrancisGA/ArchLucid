using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>DX-49 golden graphs for topology-anti-pattern, security-baseline-expectation, and required-capability-coverage.</summary>
internal static class GoldenCorpusDx49GraphFactory
{
    internal static GraphSnapshot CreateTopologyAntiPatternGraph()
    {
        return WrapCaseGraph(
            caseNumber: 61,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "cmp-golden-61",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "orders-api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
                new GraphNode
                {
                    NodeId = "ds-golden-61",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "orders-sql",
                    Category = GraphTopologyCategories.Data,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
            ],
            edges: []);
    }

    internal static GraphSnapshot CreateSecurityBaselineExpectationGraph()
    {
        return WrapCaseGraph(
            caseNumber: 62,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "cmp-golden-62",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "billing-api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
            ],
            edges: []);
    }

    internal static GraphSnapshot CreateRequiredCapabilityCoverageGraph()
    {
        return WrapCaseGraph(
            caseNumber: 63,
            nodes:
            [
                new GraphNode
                {
                    NodeId = "ctx-golden-63",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = "encryption-at-rest",
                    },
                },
                new GraphNode
                {
                    NodeId = "cmp-golden-63",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
            ],
            edges: []);
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
