using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>Brute-force relationship mapping for the differential merge oracle (no shared endpoint index).</summary>
internal static class NaiveTopologyRelationshipEdgeMapper
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

        List<GraphEdge> edges = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!TryResolveNodeIdBrute(topologyNodes, relationship.SourceId, endpointAliases, out string? fromNodeId))
                continue;

            if (!TryResolveNodeIdBrute(topologyNodes, relationship.TargetId, endpointAliases, out string? toNodeId))
                continue;

            string edgeType = MapRelationshipType(relationship.RelationshipType);
            edges.Add(new GraphEdge
            {
                EdgeId = $"agent-rel-{fromNodeId}-{toNodeId}-{edgeType}",
                FromNodeId = fromNodeId!,
                ToNodeId = toNodeId!,
                EdgeType = edgeType,
                Label = relationship.RelationshipType.ToString(),
                Weight = 1d,
                InferenceSource = GraphEdgeInferenceSources.AgentProposalRelationship
            });
        }

        return edges;
    }

    private static bool TryResolveNodeIdBrute(
        IReadOnlyList<GraphNode> topologyNodes,
        string? candidate,
        IReadOnlyDictionary<string, string>? endpointAliases,
        out string? nodeId)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            nodeId = null;
            return false;
        }

        string trimmed = candidate.Trim();

        if (endpointAliases is not null && endpointAliases.TryGetValue(trimmed, out string? aliasNodeId))
        {
            nodeId = aliasNodeId;
            return true;
        }

        if (GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(trimmed))
        {
            string normalized = GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(trimmed);

            if (endpointAliases is not null && endpointAliases.TryGetValue(normalized, out aliasNodeId))
            {
                nodeId = aliasNodeId;
                return true;
            }
        }

        foreach (GraphNode node in topologyNodes)
        {
            if (NodeMatchesEndpointCandidate(node, trimmed))
            {
                nodeId = node.NodeId;
                return true;
            }
        }

        nodeId = null;
        return false;
    }

    private static bool NodeMatchesEndpointCandidate(GraphNode node, string candidate)
    {
        if (string.Equals(node.NodeId, candidate, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(node.Label, candidate, StringComparison.OrdinalIgnoreCase))
            return true;

        if (!string.Equals(node.SourceId, "ProposedChanges", StringComparison.OrdinalIgnoreCase)
            && string.Equals(node.SourceId, candidate, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string? armId = GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node);

        if (GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(candidate)
            && GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(armId)
            && string.Equals(
                GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(candidate),
                GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(armId!),
                StringComparison.Ordinal))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(node.Label))
        {
            if (string.Equals(candidate, $"svc-{node.Label}", StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(candidate, $"ds-{node.Label}", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static string MapRelationshipType(RelationshipType relationshipType) =>
        relationshipType == RelationshipType.AuthenticatesWith
            ? GraphEdgeTypes.DependsOn
            : GraphEdgeTypes.ConnectsTo;
}
