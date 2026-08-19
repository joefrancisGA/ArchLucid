using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class TopologyAntiPatternFindingEngine : IFindingEngine
{
    public string EngineType => "topology-anti-pattern";

    public string Category => "Topology";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        List<Finding> findings = [];
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);

        if (topologyNodes.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>(findings);

        List<GraphNode> computeNodes = topologyNodes
            .Where(n => string.Equals(n.Category, GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase))
            .ToList();

        List<GraphNode> dataNodes = topologyNodes
            .Where(n =>
                string.Equals(n.Category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                || string.Equals(n.Category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase))
            .ToList();

        HashSet<string> connectedTargets = graphSnapshot.Edges
            .Where(e =>
                string.Equals(e.EdgeType, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase)
                || string.Equals(e.EdgeType, GraphEdgeTypes.DependsOn, StringComparison.OrdinalIgnoreCase))
            .Select(e => e.ToNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (computeNodes.Count > 0)
        {
            foreach (GraphNode data in dataNodes)
            {
                if (connectedTargets.Contains(data.NodeId))
                    continue;

                findings.Add(FindingFactory.CreateTopologyGapFinding(
                    EngineType,
                    $"Datastore '{data.Label}' has no compute dependency edge",
                    "No CONNECTS_TO or DEPENDS_ON edge links a compute resource to this datastore.",
                    "datastore-without-compute-dependency",
                    $"Datastore '{data.Label}' is isolated from compute in the topology graph.",
                    "Reviewers cannot trace data-flow or blast-radius paths for this datastore.",
                    FindingSeverity.Warning,
                    [data.NodeId]));
            }
        }

        foreach (GraphNode node in topologyNodes)
        {
            if (!LooksPubliclyExposed(node))
                continue;

            findings.Add(FindingFactory.CreateTopologyGapFinding(
                EngineType,
                $"Topology resource '{node.Label}' appears publicly exposed",
                "The resource is flagged for public exposure via properties or naming.",
                "public-exposure-suspected",
                $"Resource '{node.Label}' may rely on a public network path.",
                "Landing-zone reviewers should confirm private connectivity and ingress controls.",
                FindingSeverity.Warning,
                [node.NodeId]));
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static bool LooksPubliclyExposed(GraphNode node)
    {
        if (node.Properties.TryGetValue("publicEndpoint", out string? publicEndpoint)
            && string.Equals(publicEndpoint, "true", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string label = node.Label ?? string.Empty;

        return label.Contains("public", StringComparison.OrdinalIgnoreCase)
               && (label.Contains("sql", StringComparison.OrdinalIgnoreCase)
                   || label.Contains("storage", StringComparison.OrdinalIgnoreCase)
                   || label.Contains("blob", StringComparison.OrdinalIgnoreCase));
    }
}
