using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Validates agent proposals against inventoried graph nodes before commit overlay (TB-2221).
/// </summary>
public static partial class AgentTopologyProposalMergeGate
{
    public static IReadOnlyList<AgentResult> FilterValidatedProposals(
        GraphSnapshot graph,
        IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(results);

        HashSet<string> inventoriedIdentifiers = ResolveInventoriedIdentifiers(graph);
        HashSet<string> relationshipEndpointKeys = ResolveRelationshipEndpointKeys(graph, inventoriedIdentifiers);

        if (graph.Nodes.Count == 0)
            return FilterGreenfieldProposals(results, relationshipEndpointKeys);

        bool allowTopologyExtension =
            HasAgentProposedTopologyNodes(graph) || inventoriedIdentifiers.Count == 0;
        HashSet<string> accumulatedEndpointKeys = new(relationshipEndpointKeys, StringComparer.OrdinalIgnoreCase);
        List<AgentResult> orderedResults = results
            .OrderBy(static result => GetMergeOrder(result.AgentType))
            .ToList();

        Dictionary<string, AgentResult> sanitizedResultsById = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentResult result in orderedResults)
        {
            if (!RequiresInventoryOverlayValidation(result.AgentType) || result.ProposedChanges is null)
                continue;

            PreRegisterDeclaredProposalEndpointKeys(
                result.ProposedChanges,
                accumulatedEndpointKeys,
                greenfield: false,
                allowTopologyExtension);
        }

        foreach (AgentResult result in orderedResults)
        {
            if (!RequiresInventoryOverlayValidation(result.AgentType) || result.ProposedChanges is null)
            {
                sanitizedResultsById[result.ResultId] = result;
                continue;
            }

            AgentTopologyProposal sanitized = SanitizeProposal(
                result.ProposedChanges,
                accumulatedEndpointKeys,
                allowTopologyExtension);

            if (ProposalIsEmpty(sanitized))
                continue;

            sanitizedResultsById[result.ResultId] = CloneWithProposal(result, sanitized);
            RegisterSanitizedProposalEndpointKeys(sanitized, accumulatedEndpointKeys);
        }

        List<AgentResult> filtered = [];

        foreach (AgentResult result in results)
        {
            if (!sanitizedResultsById.TryGetValue(result.ResultId, out AgentResult? sanitizedResult))
                continue;

            filtered.Add(sanitizedResult);
        }

        return filtered;
    }

    private static int GetMergeOrder(AgentType agentType) =>
        agentType switch
        {
            AgentType.Topology => 10,
            AgentType.Cost => 20,
            AgentType.Compliance => 30,
            AgentType.Critic => 40,
            _ => 100,
        };

    private static HashSet<string> ResolveInventoriedIdentifiers(GraphSnapshot graph)
    {
        HashSet<string> identifiers = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            if (IsAgentProposedNode(node))
                continue;

            TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(identifiers, node);
        }

        return identifiers;
    }

    private static HashSet<string> ResolveRelationshipEndpointKeys(
        GraphSnapshot graph,
        HashSet<string> inventoriedIdentifiers)
    {
        HashSet<string> relationshipEndpointKeys = new(inventoriedIdentifiers, StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!IsAgentProposedNode(node))
                continue;

            TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(relationshipEndpointKeys, node);
        }

        return relationshipEndpointKeys;
    }

    private static bool IsAgentProposedNode(GraphNode node) =>
        string.Equals(node.SourceType, nameof(AgentType.Topology), StringComparison.OrdinalIgnoreCase)
        && string.Equals(node.SourceId, "ProposedChanges", StringComparison.OrdinalIgnoreCase);

    private static bool HasAgentProposedTopologyNodes(GraphSnapshot graph)
    {
        foreach (GraphNode node in graph.Nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            if (IsAgentProposedNode(node))
                return true;
        }

        return false;
    }
}
