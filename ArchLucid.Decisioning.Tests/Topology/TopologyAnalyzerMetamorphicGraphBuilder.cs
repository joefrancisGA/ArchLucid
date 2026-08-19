using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.Topology;

/// <summary>Small graph builders for topology analyzer metamorphic relations.</summary>
internal static class TopologyAnalyzerMetamorphicGraphBuilder
{
    internal static GraphSnapshot BuildComputeWithoutNetworkAnchor()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "cmp-hub",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                }
            ],
            Edges = []
        };
    }

    internal static GraphSnapshot BuildHubSpokeWithIsolatedDatastore()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                HubNode("cmp-hub", "api"),
                DataNode("ds-spoke-0", "orders-sql"),
                DataNode("ds-spoke-1", "cache"),
                DataNode("ds-isolated", "archive-sql")
            ],
            Edges =
            [
                Connects("cmp-hub", "ds-spoke-0"),
                Connects("cmp-hub", "ds-spoke-1")
            ]
        };
    }

    internal static GraphSnapshot BuildCoverageBaseline()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                HubNode("cmp-1", "api"),
                DataNode("ds-1", "sql"),
                new GraphNode
                {
                    NodeId = "net-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vnet",
                    Category = GraphTopologyCategories.Network,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                }
            ],
            Edges = [Connects("cmp-1", "ds-1")]
        };
    }

    internal static GraphSnapshot RelabelNodes(GraphSnapshot graph, string prefix)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentException.ThrowIfNullOrWhiteSpace(prefix);

        Dictionary<string, string> remap = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            remap[node.NodeId] = prefix + node.NodeId;
        }

        return new GraphSnapshot
        {
            SchemaVersion = graph.SchemaVersion,
            GraphSnapshotId = graph.GraphSnapshotId,
            ContextSnapshotId = graph.ContextSnapshotId,
            RunId = graph.RunId,
            CreatedUtc = graph.CreatedUtc,
            Nodes = graph.Nodes.Select(node => CloneNode(node, remap[node.NodeId])).ToList(),
            Edges = graph.Edges.Select(edge => new GraphEdge
            {
                EdgeId = prefix + edge.EdgeId,
                FromNodeId = remap[edge.FromNodeId],
                ToNodeId = remap[edge.ToNodeId],
                EdgeType = edge.EdgeType,
                Label = edge.Label,
                Weight = edge.Weight,
                InferenceSource = edge.InferenceSource,
                ReasoningTrace = edge.ReasoningTrace,
                Properties = new Dictionary<string, string>(edge.Properties, StringComparer.OrdinalIgnoreCase)
            }).ToList(),
            Warnings = [.. graph.Warnings]
        };
    }

    internal static GraphSnapshot AddIsolatedNode(GraphSnapshot graph, GraphNode isolatedNode)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(isolatedNode);

        return new GraphSnapshot
        {
            SchemaVersion = graph.SchemaVersion,
            GraphSnapshotId = graph.GraphSnapshotId,
            ContextSnapshotId = graph.ContextSnapshotId,
            RunId = graph.RunId,
            CreatedUtc = graph.CreatedUtc,
            Nodes = [.. graph.Nodes, isolatedNode],
            Edges = [.. graph.Edges],
            Warnings = [.. graph.Warnings]
        };
    }

    internal static GraphSnapshot RemoveNode(GraphSnapshot graph, string nodeId)
    {
        ArgumentNullException.ThrowIfNull(graph);

        List<GraphNode> nodes = graph.Nodes
            .Where(n => !string.Equals(n.NodeId, nodeId, StringComparison.OrdinalIgnoreCase))
            .ToList();

        List<GraphEdge> edges = graph.Edges
            .Where(e =>
                !string.Equals(e.FromNodeId, nodeId, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(e.ToNodeId, nodeId, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return new GraphSnapshot
        {
            SchemaVersion = graph.SchemaVersion,
            GraphSnapshotId = graph.GraphSnapshotId,
            ContextSnapshotId = graph.ContextSnapshotId,
            RunId = graph.RunId,
            CreatedUtc = graph.CreatedUtc,
            Nodes = nodes,
            Edges = edges,
            Warnings = [.. graph.Warnings]
        };
    }

    internal static GraphNode IsolatedComputeNode(string nodeId, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = GraphTopologyCategories.Compute,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        };
    }

    private static GraphNode HubNode(string nodeId, string label) =>
        IsolatedComputeNode(nodeId, label);

    private static GraphNode DataNode(string nodeId, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = GraphTopologyCategories.Data,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        };
    }

    private static GraphEdge Connects(string fromNodeId, string toNodeId)
    {
        return new GraphEdge
        {
            EdgeId = fromNodeId + "-" + toNodeId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo
        };
    }

    private static GraphNode CloneNode(GraphNode node, string newNodeId)
    {
        return new GraphNode
        {
            NodeId = newNodeId,
            NodeType = node.NodeType,
            Label = node.Label,
            Category = node.Category,
            SourceType = node.SourceType,
            SourceId = node.SourceId,
            ReasoningTrace = node.ReasoningTrace,
            Properties = new Dictionary<string, string>(node.Properties, StringComparer.OrdinalIgnoreCase)
        };
    }
}
