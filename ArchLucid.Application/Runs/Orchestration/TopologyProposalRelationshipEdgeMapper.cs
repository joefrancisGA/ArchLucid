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

        HashSet<string> unindexedTerraformEndpointIdentities = [];
        HashSet<string> indexedTerraformEndpointIdentities = [];
        // A root address may resolve to an indexed node only when that root has one inventoried instance.
        Dictionary<string, string> uniqueIndexedTerraformEndpointNodeIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> ambiguousIndexedTerraformEndpointIdentities = [];
        Dictionary<string, string> endpointKeyToNodeId = BuildEndpointResolutionIndex(
            topologyNodes,
            endpointAliases,
            unindexedTerraformEndpointIdentities,
            indexedTerraformEndpointIdentities,
            uniqueIndexedTerraformEndpointNodeIds,
            ambiguousIndexedTerraformEndpointIdentities);

        List<GraphEdge> edges = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!TryResolveNodeId(
                    relationship.SourceId,
                    endpointKeyToNodeId,
                    unindexedTerraformEndpointIdentities,
                    indexedTerraformEndpointIdentities,
                    out string? fromNodeId))
                continue;

            if (!TryResolveNodeId(
                    relationship.TargetId,
                    endpointKeyToNodeId,
                    unindexedTerraformEndpointIdentities,
                    indexedTerraformEndpointIdentities,
                    out string? toNodeId))
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
        IReadOnlyDictionary<string, string>? endpointAliases,
        HashSet<string> unindexedTerraformEndpointIdentities,
        HashSet<string> indexedTerraformEndpointIdentities,
        Dictionary<string, string> uniqueIndexedTerraformEndpointNodeIds,
        HashSet<string> ambiguousIndexedTerraformEndpointIdentities)
    {
        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in topologyNodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, node);

            string? terraformEndpointIdentity =
                TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(node.SourceId);

            if (terraformEndpointIdentity is null)
                continue;

            string? withoutInstanceKey =
                TerraformAzurermResourceTypeParser.TryStripTrailingInstanceKey(terraformEndpointIdentity);

            if (withoutInstanceKey is null)
                unindexedTerraformEndpointIdentities.Add(terraformEndpointIdentity);
            else
            {
                indexedTerraformEndpointIdentities.Add(withoutInstanceKey);

                if (ambiguousIndexedTerraformEndpointIdentities.Contains(withoutInstanceKey))
                    continue;

                if (!uniqueIndexedTerraformEndpointNodeIds.TryAdd(withoutInstanceKey, node.NodeId))
                {
                    uniqueIndexedTerraformEndpointNodeIds.Remove(withoutInstanceKey);
                    ambiguousIndexedTerraformEndpointIdentities.Add(withoutInstanceKey);
                }
            }
        }

        foreach (KeyValuePair<string, string> uniqueIndexedEndpoint in uniqueIndexedTerraformEndpointNodeIds)
        {
            if (unindexedTerraformEndpointIdentities.Contains(uniqueIndexedEndpoint.Key)
                || ambiguousIndexedTerraformEndpointIdentities.Contains(uniqueIndexedEndpoint.Key))
                continue;

            endpointKeyToNodeId.TryAdd(uniqueIndexedEndpoint.Key, uniqueIndexedEndpoint.Value);
        }

        foreach (GraphNode node in topologyNodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            TopologyProposalTerraformSourceIdHeuristics.AddGraphNodeTerraformSyntheticLabelResolutionFallback(
                endpointKeyToNodeId,
                node.Label,
                node.Category,
                node.SourceId,
                node.NodeId);
        }

        foreach (GraphNode node in topologyNodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            TopologyProposalTerraformSourceIdHeuristics.PreferCategorizedSyntheticAlias(
                endpointKeyToNodeId,
                node.Label,
                node.Category,
                node.NodeId);
        }

        if (endpointAliases is null)
            return endpointKeyToNodeId;

        foreach (KeyValuePair<string, string> alias in endpointAliases)
        {
            if (string.IsNullOrWhiteSpace(alias.Key) || string.IsNullOrWhiteSpace(alias.Value))
                continue;

            string trimmedKey = alias.Key.Trim();
            string resolvedNodeId = NormalizeAliasTargetNodeId(alias.Value);

            if (TryResolveNodeId(
                    resolvedNodeId,
                    endpointKeyToNodeId,
                    unindexedTerraformEndpointIdentities,
                    indexedTerraformEndpointIdentities,
                    out string canonicalNodeId))
                resolvedNodeId = canonicalNodeId;

            endpointKeyToNodeId.TryAdd(trimmedKey, resolvedNodeId);

            string? normalizedSyntheticKey =
                TopologyProposalRelationshipEndpointIndex.NormalizeSyntheticEndpointReference(trimmedKey);

            if (normalizedSyntheticKey is not null)
                endpointKeyToNodeId.TryAdd(normalizedSyntheticKey, resolvedNodeId);
        }

        return endpointKeyToNodeId;
    }

    private static string NormalizeAliasTargetNodeId(string aliasTargetNodeId)
    {
        string trimmed = aliasTargetNodeId.Trim();

        return TopologyProposalRelationshipEndpointIndex.NormalizeSyntheticEndpointReference(trimmed)
               ?? trimmed;
    }

    private static string MapRelationshipType(RelationshipType relationshipType) =>
        relationshipType == RelationshipType.AuthenticatesWith
            ? GraphEdgeTypes.DependsOn
            : GraphEdgeTypes.ConnectsTo;

    private static bool TryResolveNodeId(
        string candidate,
        Dictionary<string, string> endpointKeyToNodeId,
        HashSet<string> unindexedTerraformEndpointIdentities,
        HashSet<string> indexedTerraformEndpointIdentities,
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

        string? normalizedSynthetic =
            TopologyProposalRelationshipEndpointIndex.NormalizeSyntheticEndpointReference(trimmedCandidate);

        if (normalizedSynthetic is not null
            && endpointKeyToNodeId.TryGetValue(normalizedSynthetic, out nodeId!))
        {
            return true;
        }

        string? terraformEndpointIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(trimmedCandidate);

        if (terraformEndpointIdentity is not null
            && endpointKeyToNodeId.TryGetValue(terraformEndpointIdentity, out nodeId!))
        {
            return true;
        }

        if (TryResolveStrippedTerraformInstanceKey(
                trimmedCandidate,
                endpointKeyToNodeId,
                unindexedTerraformEndpointIdentities,
                indexedTerraformEndpointIdentities,
                out nodeId!))
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

    private static bool TryResolveStrippedTerraformInstanceKey(
        string trimmedCandidate,
        Dictionary<string, string> endpointKeyToNodeId,
        HashSet<string> unindexedTerraformEndpointIdentities,
        HashSet<string> indexedTerraformEndpointIdentities,
        out string nodeId)
    {
        string? withoutInstanceKey = TerraformAzurermResourceTypeParser.TryStripTrailingInstanceKey(trimmedCandidate);

        if (withoutInstanceKey is null)
        {
            nodeId = string.Empty;
            return false;
        }

        string? strippedIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(withoutInstanceKey);

        if (strippedIdentity is not null
            && unindexedTerraformEndpointIdentities.Contains(strippedIdentity)
            && !indexedTerraformEndpointIdentities.Contains(strippedIdentity)
            && endpointKeyToNodeId.TryGetValue(strippedIdentity, out nodeId!))
        {
            return true;
        }

        nodeId = string.Empty;
        return false;
    }
}
