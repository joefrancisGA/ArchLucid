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
        IReadOnlyList<ManifestRelationship> relationships)
    {
        ArgumentNullException.ThrowIfNull(topologyNodes);
        ArgumentNullException.ThrowIfNull(relationships);

        if (relationships.Count == 0)
            return [];

        Dictionary<string, string> idByLabel = topologyNodes
            .Where(static n => !string.IsNullOrWhiteSpace(n.Label))
            .GroupBy(static n => n.Label, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static g => g.Key, static g => g.First().NodeId, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, string> idByNodeId = topologyNodes
            .ToDictionary(static n => n.NodeId, static n => n.NodeId, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, string> idBySourceId = topologyNodes
            .Where(static n => !string.IsNullOrWhiteSpace(n.SourceId))
            .GroupBy(static n => n.SourceId!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static g => g.Key, static g => g.First().NodeId, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, string> idByArmResourceId = BuildArmResourceIdIndex(topologyNodes);

        List<GraphEdge> edges = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!TryResolveNodeId(relationship.SourceId, idByLabel, idByNodeId, idBySourceId, idByArmResourceId, out string? fromNodeId))
                continue;

            if (!TryResolveNodeId(relationship.TargetId, idByLabel, idByNodeId, idBySourceId, idByArmResourceId, out string? toNodeId))
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

    private static Dictionary<string, string> BuildArmResourceIdIndex(IReadOnlyList<GraphNode> topologyNodes)
    {
        Dictionary<string, string> idByArmResourceId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in topologyNodes)
        {
            string? resourceId = GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node);

            if (string.IsNullOrWhiteSpace(resourceId))
                continue;

            idByArmResourceId.TryAdd(resourceId, node.NodeId);
            idByArmResourceId.TryAdd(GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId), node.NodeId);
        }

        return idByArmResourceId;
    }

    private static string MapRelationshipType(RelationshipType relationshipType) =>
        relationshipType == RelationshipType.AuthenticatesWith
            ? GraphEdgeTypes.DependsOn
            : GraphEdgeTypes.ConnectsTo;

    private static bool TryResolveNodeId(
        string candidate,
        Dictionary<string, string> idByLabel,
        Dictionary<string, string> idByNodeId,
        Dictionary<string, string> idBySourceId,
        Dictionary<string, string> idByArmResourceId,
        out string nodeId)
    {
        if (idByNodeId.TryGetValue(candidate, out nodeId!))
            return true;

        if (idBySourceId.TryGetValue(candidate, out nodeId!))
            return true;

        if (idByArmResourceId.TryGetValue(candidate, out nodeId!))
            return true;

        if (GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(candidate)
            && idByArmResourceId.TryGetValue(
                GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(candidate),
                out nodeId!))
        {
            return true;
        }

        if (idByLabel.TryGetValue(candidate, out nodeId!))
            return true;

        nodeId = string.Empty;
        return false;
    }
}
