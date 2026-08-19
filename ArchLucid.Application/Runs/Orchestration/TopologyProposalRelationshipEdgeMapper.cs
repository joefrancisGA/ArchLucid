using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Maps topology agent <see cref="ManifestRelationship" /> proposals onto typed graph edges.
/// </summary>
public static class TopologyProposalRelationshipEdgeMapper
{
    public static IReadOnlyList<GraphEdge> MapRelationships(
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyList<ManifestRelationship> relationships,
        IReadOnlyDictionary<string, string>? endpointAliases = null)
    {
        ArgumentNullException.ThrowIfNull(topologyNodes);
        ArgumentNullException.ThrowIfNull(relationships);

        if (relationships.Count == 0)
            return [];

        Dictionary<string, string> endpointKeyToNodeId = BuildEndpointResolutionIndex(topologyNodes, endpointAliases);

        List<GraphEdge> edges = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!TryResolveNodeId(relationship.SourceId, endpointKeyToNodeId, out string? fromNodeId))
                continue;

            if (!TryResolveNodeId(relationship.TargetId, endpointKeyToNodeId, out string? toNodeId))
                continue;

            string edgeType = MapRelationshipType(relationship.RelationshipType);
            edges.Add(new GraphEdge
            {
                EdgeId = $"agent-rel-{fromNodeId}-{toNodeId}-{edgeType}",
                FromNodeId = fromNodeId,
                ToNodeId = toNodeId,
                EdgeType = edgeType,
                Label = relationship.RelationshipType.ToString(),
                Weight = 1d,
                InferenceSource = GraphEdgeInferenceSources.AgentProposalRelationship
            });
        }

        return edges;
    }

    private static Dictionary<string, string> BuildEndpointResolutionIndex(
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyDictionary<string, string>? endpointAliases)
    {
        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in topologyNodes)
        {
            TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, node);
        }

        if (endpointAliases is null)
            return endpointKeyToNodeId;

        foreach (KeyValuePair<string, string> alias in endpointAliases)
        {
            endpointKeyToNodeId.TryAdd(alias.Key, alias.Value);
        }

        return endpointKeyToNodeId;
    }

    private static string MapRelationshipType(RelationshipType relationshipType) =>
        relationshipType == RelationshipType.AuthenticatesWith
            ? GraphEdgeTypes.DependsOn
            : GraphEdgeTypes.ConnectsTo;

    private static bool TryResolveNodeId(
        string candidate,
        Dictionary<string, string> endpointKeyToNodeId,
        out string nodeId)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            nodeId = string.Empty;
            return false;
        }

        string trimmedCandidate = candidate.Trim();

        if (endpointKeyToNodeId.TryGetValue(trimmedCandidate, out nodeId!))
            return true;

        if (GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(trimmedCandidate)
            && endpointKeyToNodeId.TryGetValue(
                GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(trimmedCandidate),
                out nodeId!))
        {
            return true;
        }

        nodeId = string.Empty;
        return false;
    }
}
