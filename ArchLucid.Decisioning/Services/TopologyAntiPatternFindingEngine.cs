using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Services;

public sealed class TopologyAntiPatternFindingEngine : IFindingEngine
{
    public string EngineType => "topology-anti-pattern";

    public string Category => "Topology";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext,
        CancellationToken ct)
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

                string datastoreLabel = GraphNodeReviewerLabel.ForFindingTitle(data.Label);

                findings.Add(FindingFactory.CreateTopologyGapFinding(
                    EngineType,
                    $"Datastore '{datastoreLabel}' has no compute dependency edge",
                    "No CONNECTS_TO or DEPENDS_ON edge links a compute resource to this datastore.",
                    "datastore-without-compute-dependency",
                    $"Datastore '{datastoreLabel}' is isolated from compute in the topology graph.",
                    "Reviewers cannot trace data-flow or blast-radius paths for this datastore.",
                    FindingSeverity.Warning,
                    [data.NodeId]));
            }
        }

        foreach (GraphNode node in topologyNodes)
        {
            if (!TryDescribePublicExposure(node, out string exposureTitle, out string exposureRationale))
                continue;

            string resourceLabel = GraphNodeReviewerLabel.ForFindingTitle(node.Label);

            findings.Add(FindingFactory.CreateTopologyGapFinding(
                EngineType,
                exposureTitle.Replace("{label}", resourceLabel, StringComparison.Ordinal),
                exposureRationale,
                "public-exposure-suspected",
                exposureRationale.Contains("publicEndpoint property was stored true", StringComparison.Ordinal)
                    ? $"Resource '{resourceLabel}' may rely on a public network path."
                    : $"Resource '{resourceLabel}' name suggests public exposure; confirm ingress controls.",
                "Landing-zone reviewers should confirm private connectivity and ingress controls.",
                FindingSeverity.Warning,
                [node.NodeId]));
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static bool TryDescribePublicExposure(
        GraphNode node,
        out string titleTemplate,
        out string rationale)
    {
        if (node.Properties.TryGetValue("publicEndpoint", out string? publicEndpoint)
            && string.Equals(publicEndpoint, "true", StringComparison.OrdinalIgnoreCase))
        {
            titleTemplate = "Topology resource '{label}' appears publicly exposed";
            rationale = "The publicEndpoint property was stored true.";
            return true;
        }

        string label = (node.Label ?? string.Empty).ToLowerInvariant();

        if (DecisioningTextTokenMatcher.ContainsStandaloneToken(label, "public")
            && (DecisioningTextTokenMatcher.ContainsStandaloneToken(label, "sql")
                || TopologyDatastoreLabelHeuristic.ContainsAffirmativeStorageKeyword(label)
                || TopologyDatastoreLabelHeuristic.ContainsAffirmativeBlobKeyword(label)))
        {
            titleTemplate =
                "Topology resource '{label}' name includes \"public\"; a public endpoint property was not stored";
            rationale =
                "Resource name includes \"public\". A public endpoint property was not stored.";
            return true;
        }

        titleTemplate = string.Empty;
        rationale = string.Empty;
        return false;
    }
}
