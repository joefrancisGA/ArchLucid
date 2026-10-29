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
        Dictionary<string, List<string>> ambiguousIndexedTerraformEndpointNodeIds = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> endpointKeyToNodeId = BuildEndpointResolutionIndex(
            topologyNodes,
            endpointAliases,
            unindexedTerraformEndpointIdentities,
            indexedTerraformEndpointIdentities,
            uniqueIndexedTerraformEndpointNodeIds,
            ambiguousIndexedTerraformEndpointIdentities,
            ambiguousIndexedTerraformEndpointNodeIds);

        List<GraphEdge> edges = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            List<string> fromNodeIds = ResolveEndpointNodeIds(
                relationship.SourceId,
                topologyNodes,
                endpointKeyToNodeId,
                unindexedTerraformEndpointIdentities,
                indexedTerraformEndpointIdentities,
                ambiguousIndexedTerraformEndpointIdentities,
                ambiguousIndexedTerraformEndpointNodeIds);

            if (fromNodeIds.Count == 0)
                continue;

            List<string> toNodeIds = ResolveEndpointNodeIds(
                relationship.TargetId,
                topologyNodes,
                endpointKeyToNodeId,
                unindexedTerraformEndpointIdentities,
                indexedTerraformEndpointIdentities,
                ambiguousIndexedTerraformEndpointIdentities,
                ambiguousIndexedTerraformEndpointNodeIds);

            if (toNodeIds.Count == 0)
                continue;

            string edgeType = MapRelationshipType(relationship.RelationshipType);

            foreach (string fromNodeId in fromNodeIds)
            {
                foreach (string toNodeId in toNodeIds)
                {
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
            }
        }

        return edges;
    }

    private static Dictionary<string, string> BuildEndpointResolutionIndex(
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyDictionary<string, string>? endpointAliases,
        HashSet<string> unindexedTerraformEndpointIdentities,
        HashSet<string> indexedTerraformEndpointIdentities,
        Dictionary<string, string> uniqueIndexedTerraformEndpointNodeIds,
        HashSet<string> ambiguousIndexedTerraformEndpointIdentities,
        Dictionary<string, List<string>> ambiguousIndexedTerraformEndpointNodeIds)
    {
        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in topologyNodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, node);

            string canonicalSourceId =
                TopologyProposalRelationshipEndpointIndex.CanonicalizeTerraformEndpointReferenceForLookup(
                    node.SourceId ?? string.Empty);

            string? terraformEndpointIdentity =
                TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(canonicalSourceId);

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
                {
                    ambiguousIndexedTerraformEndpointNodeIds[withoutInstanceKey].Add(node.NodeId);
                    continue;
                }

                if (!uniqueIndexedTerraformEndpointNodeIds.TryAdd(withoutInstanceKey, node.NodeId))
                {
                    string firstNodeId = uniqueIndexedTerraformEndpointNodeIds[withoutInstanceKey];
                    uniqueIndexedTerraformEndpointNodeIds.Remove(withoutInstanceKey);
                    ambiguousIndexedTerraformEndpointIdentities.Add(withoutInstanceKey);
                    ambiguousIndexedTerraformEndpointNodeIds[withoutInstanceKey] = [firstNodeId, node.NodeId];
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

            if (GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(trimmedKey))
            {
                TopologyProposalEndpointArmKeys.AddArmResourceIdResolutionAliases(
                    endpointKeyToNodeId,
                    trimmedKey,
                    resolvedNodeId);
            }
            else
            {
                endpointKeyToNodeId.TryAdd(trimmedKey, resolvedNodeId);

                string canonicalTerraformKey =
                    TopologyProposalRelationshipEndpointIndex.CanonicalizeTerraformEndpointReferenceForLookup(trimmedKey);

                if (!string.Equals(canonicalTerraformKey, trimmedKey, StringComparison.OrdinalIgnoreCase))
                    endpointKeyToNodeId.TryAdd(canonicalTerraformKey, resolvedNodeId);
            }

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

        if (GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(trimmed))
            return GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(trimmed);

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

        string trimmedCandidate =
            TopologyProposalRelationshipEndpointIndex.CanonicalizeTerraformEndpointReferenceForLookup(candidate.Trim());

        if (TryResolveMappedNodeId(trimmedCandidate, endpointKeyToNodeId, out nodeId))
            return true;

        string? normalizedSynthetic =
            TopologyProposalRelationshipEndpointIndex.NormalizeSyntheticEndpointReference(trimmedCandidate);

        if (normalizedSynthetic is not null
            && TryResolveMappedNodeId(normalizedSynthetic, endpointKeyToNodeId, out nodeId))
        {
            return true;
        }

        string? terraformEndpointIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(trimmedCandidate);

        if (terraformEndpointIdentity is not null
            && TryResolveMappedNodeId(terraformEndpointIdentity, endpointKeyToNodeId, out nodeId))
        {
            return true;
        }

        if (TryResolveStrippedTerraformInstanceKey(
                trimmedCandidate,
                endpointKeyToNodeId,
                unindexedTerraformEndpointIdentities,
                indexedTerraformEndpointIdentities,
                out nodeId!))
        {
            nodeId = FollowEndpointAliasChain(nodeId, endpointKeyToNodeId);
            return true;
        }

        if (GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(trimmedCandidate)
            && TryResolveMappedNodeId(
                GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(trimmedCandidate),
                endpointKeyToNodeId,
                out nodeId))
        {
            return true;
        }

        nodeId = string.Empty;
        return false;
    }

    private static bool TryResolveMappedNodeId(
        string endpointKey,
        Dictionary<string, string> endpointKeyToNodeId,
        out string nodeId)
    {
        if (!endpointKeyToNodeId.TryGetValue(endpointKey, out nodeId!))
            return false;

        nodeId = ResolveAliasChainTerminal(nodeId, endpointKeyToNodeId);
        return true;
    }

    private static string ResolveAliasChainTerminal(
        string aliasTarget,
        Dictionary<string, string> endpointKeyToNodeId)
    {
        string current = FollowEndpointAliasChain(aliasTarget, endpointKeyToNodeId);

        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(current))
            return current;

        string normalizedArmId = GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(current);

        if (endpointKeyToNodeId.TryGetValue(normalizedArmId, out string? mappedNodeId))
            return ResolveAliasChainTerminal(mappedNodeId, endpointKeyToNodeId);

        return normalizedArmId;
    }

    private static string FollowEndpointAliasChain(
        string resolvedNodeId,
        Dictionary<string, string> endpointKeyToNodeId)
    {
        string current = resolvedNodeId.Trim();
        HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase) { current };

        while (endpointKeyToNodeId.TryGetValue(current, out string? next))
        {
            string trimmedNext = next.Trim();

            if (string.Equals(current, trimmedNext, StringComparison.OrdinalIgnoreCase))
                break;

            if (!visited.Add(trimmedNext))
                break;

            current = trimmedNext;
        }

        return current;
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

    private static List<string> ResolveEndpointNodeIds(
        string candidate,
        IReadOnlyList<GraphNode> topologyNodes,
        Dictionary<string, string> endpointKeyToNodeId,
        HashSet<string> unindexedTerraformEndpointIdentities,
        HashSet<string> indexedTerraformEndpointIdentities,
        HashSet<string> ambiguousIndexedTerraformEndpointIdentities,
        Dictionary<string, List<string>> ambiguousIndexedTerraformEndpointNodeIds)
    {
        if (TryResolveNodeId(
                candidate,
                endpointKeyToNodeId,
                unindexedTerraformEndpointIdentities,
                indexedTerraformEndpointIdentities,
                out string nodeId))
        {
            return [nodeId];
        }

        string? strippedIdentity = ResolveAmbiguousIndexedTerraformRootIdentity(
            candidate,
            ambiguousIndexedTerraformEndpointIdentities);

        if (strippedIdentity is not null
            && ambiguousIndexedTerraformEndpointNodeIds.TryGetValue(strippedIdentity, out List<string>? nodeIds))
        {
            return nodeIds;
        }

        return [];
    }

    private static string? ResolveAmbiguousIndexedTerraformRootIdentity(
        string candidate,
        HashSet<string> ambiguousIndexedTerraformEndpointIdentities)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return null;
        }

        string trimmedCandidate = candidate.Trim();
        string? terraformEndpointIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(trimmedCandidate);

        string identityForInstanceCheck = terraformEndpointIdentity ?? trimmedCandidate;
        string? explicitInstanceStripped =
            TerraformAzurermResourceTypeParser.TryStripTrailingInstanceKey(identityForInstanceCheck);

        if (explicitInstanceStripped is not null
            && !string.Equals(explicitInstanceStripped, identityForInstanceCheck, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (terraformEndpointIdentity is not null
            && ambiguousIndexedTerraformEndpointIdentities.Contains(terraformEndpointIdentity))
        {
            return terraformEndpointIdentity;
        }

        string? withoutInstanceKey = TerraformAzurermResourceTypeParser.TryStripTrailingInstanceKey(trimmedCandidate);

        if (withoutInstanceKey is null)
        {
            return null;
        }

        string? strippedIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(withoutInstanceKey);

        if (strippedIdentity is not null
            && ambiguousIndexedTerraformEndpointIdentities.Contains(strippedIdentity))
        {
            return strippedIdentity;
        }

        return ambiguousIndexedTerraformEndpointIdentities.Contains(withoutInstanceKey)
            ? withoutInstanceKey
            : null;
    }
}
