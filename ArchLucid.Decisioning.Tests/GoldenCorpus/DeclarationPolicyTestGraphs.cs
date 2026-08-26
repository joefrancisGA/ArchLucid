using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Shared graph fixtures for declaration policy-gate tests.</summary>
internal static class DeclarationPolicyTestGraphs
{
    internal static GraphSnapshot CreatePublicAccessAndHttpsDisabledGraph() => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "app-1",
                NodeType = "TopologyResource",
                Label = "api",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["tf.public_network_access"] = "enabled",
                    ["httpsOnly"] = "false",
                },
            },
        ],
    };

    internal static GraphSnapshot CreatePrivateBaselinePublicDeclarationGraph() => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "baseline-private",
                NodeType = GraphNodeTypes.SecurityBaseline,
                Label = "Private only network access",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["description"] = "Private only network access required",
                },
            },
            new GraphNode
            {
                NodeId = "obj-storage",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "docs",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["tf.public_network_access"] = "enabled",
                },
            },
        ],
        Edges =
        [
            new GraphEdge
            {
                FromNodeId = "baseline-private",
                ToNodeId = "obj-storage",
                EdgeType = GraphEdgeTypes.Protects,
                Weight = 0.9,
            },
        ],
    };
}
