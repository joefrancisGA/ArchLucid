using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Validates agent proposals against inventoried graph nodes before commit overlay (TB-2221).
/// </summary>
public static class AgentTopologyProposalMergeGate
{
    public static IReadOnlyList<AgentResult> FilterValidatedProposals(
        GraphSnapshot graph,
        IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(results);

        HashSet<string> inventoriedIdentifiers = ResolveInventoriedIdentifiers(graph);
        HashSet<string> relationshipEndpointKeys = ResolveRelationshipEndpointKeys(graph, inventoriedIdentifiers);

        if (relationshipEndpointKeys.Count == 0)
            return FilterGreenfieldProposals(results);

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
                greenfield: false);
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
                accumulatedEndpointKeys);

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

    private static IReadOnlyList<AgentResult> FilterGreenfieldProposals(IReadOnlyList<AgentResult> results)
    {
        HashSet<string> accumulatedEndpointKeys = new(StringComparer.OrdinalIgnoreCase);
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
                greenfield: true);
        }

        foreach (AgentResult result in orderedResults)
        {
            if (!RequiresInventoryOverlayValidation(result.AgentType) || result.ProposedChanges is null)
            {
                sanitizedResultsById[result.ResultId] = result;
                continue;
            }

            if (IsUndeclaredRelationshipOnlyProposal(result.ProposedChanges) && accumulatedEndpointKeys.Count == 0)
                continue;

            AgentTopologyProposal sanitized = SanitizeGreenfieldProposal(
                result.ProposedChanges,
                accumulatedEndpointKeys);

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

    private static AgentTopologyProposal SanitizeGreenfieldProposal(
        AgentTopologyProposal proposal,
        HashSet<string> accumulatedEndpointKeys)
    {
        List<ManifestService> services = proposal.AddedServices?
            .Where(s => !string.IsNullOrWhiteSpace(s.ServiceName) || !string.IsNullOrWhiteSpace(s.ServiceId))
            .ToList() ?? [];

        List<ManifestDatastore> datastores = proposal.AddedDatastores?
            .Where(d => !string.IsNullOrWhiteSpace(d.DatastoreName) || !string.IsNullOrWhiteSpace(d.DatastoreId))
            .ToList() ?? [];

        List<ManifestRelationship> relationships = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            accumulatedEndpointKeys,
            services,
            datastores,
            proposal.AddedRelationships);

        return new AgentTopologyProposal
        {
            ProposalId = proposal.ProposalId,
            SourceAgent = proposal.SourceAgent,
            AddedServices = services,
            AddedDatastores = datastores,
            AddedRelationships = relationships,
            RequiredControls = proposal.RequiredControls,
            Warnings = proposal.Warnings
        };
    }

    private static bool IsUndeclaredRelationshipOnlyProposal(AgentTopologyProposal proposal) =>
        (proposal.AddedServices?.Count ?? 0) == 0
        && (proposal.AddedDatastores?.Count ?? 0) == 0
        && (proposal.AddedRelationships?.Count ?? 0) > 0
        && (proposal.RequiredControls?.Count ?? 0) == 0;

    private static int GetMergeOrder(AgentType agentType) =>
        agentType switch
        {
            AgentType.Topology => 10,
            AgentType.Cost => 20,
            AgentType.Compliance => 30,
            AgentType.Critic => 40,
            _ => 100,
        };

    private static void RegisterSanitizedProposalEndpointKeys(
        AgentTopologyProposal proposal,
        HashSet<string> endpointKeys)
    {
        if (proposal.AddedServices is { Count: > 0 })
        {
            foreach (ManifestService service in proposal.AddedServices)
            {
                TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointKeys(endpointKeys, service);
            }
        }

        if (proposal.AddedDatastores is { Count: > 0 })
        {
            foreach (ManifestDatastore datastore in proposal.AddedDatastores)
            {
                TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointKeys(endpointKeys, datastore);
            }
        }
    }

    private static void PreRegisterDeclaredProposalEndpointKeys(
        AgentTopologyProposal proposal,
        HashSet<string> endpointKeys,
        bool greenfield)
    {
        if (proposal.AddedServices is { Count: > 0 })
        {
            foreach (ManifestService service in proposal.AddedServices)
            {
                if (!greenfield
                    && !MatchesInventoriedIdentifier(service.ServiceName, service.ServiceId, endpointKeys))
                {
                    continue;
                }

                TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointKeys(endpointKeys, service);
            }
        }

        if (proposal.AddedDatastores is { Count: > 0 })
        {
            foreach (ManifestDatastore datastore in proposal.AddedDatastores)
            {
                if (!greenfield
                    && !MatchesInventoriedIdentifier(datastore.DatastoreName, datastore.DatastoreId, endpointKeys))
                {
                    continue;
                }

                TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointKeys(endpointKeys, datastore);
            }
        }
    }

    private static bool RequiresInventoryOverlayValidation(AgentType agentType) =>
        agentType is AgentType.Topology or AgentType.Cost or AgentType.Compliance or AgentType.Critic;

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

    private static AgentTopologyProposal SanitizeProposal(
        AgentTopologyProposal proposal,
        HashSet<string> relationshipEndpointKeys)
    {
        List<ManifestService> services = proposal.AddedServices?
            .Where(s => !string.IsNullOrWhiteSpace(s.ServiceName) || !string.IsNullOrWhiteSpace(s.ServiceId))
            .Where(s => MatchesInventoriedIdentifier(s.ServiceName, s.ServiceId, relationshipEndpointKeys))
            .ToList() ?? [];

        List<ManifestDatastore> datastores = proposal.AddedDatastores?
            .Where(d => !string.IsNullOrWhiteSpace(d.DatastoreName) || !string.IsNullOrWhiteSpace(d.DatastoreId))
            .Where(d => MatchesInventoriedIdentifier(d.DatastoreName, d.DatastoreId, relationshipEndpointKeys))
            .ToList() ?? [];

        List<ManifestRelationship> relationships = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            relationshipEndpointKeys,
            services,
            datastores,
            proposal.AddedRelationships);

        return new AgentTopologyProposal
        {
            ProposalId = proposal.ProposalId,
            SourceAgent = proposal.SourceAgent,
            AddedServices = services,
            AddedDatastores = datastores,
            AddedRelationships = relationships,
            RequiredControls = proposal.RequiredControls,
            Warnings = proposal.Warnings
        };
    }

    private static bool MatchesInventoriedIdentifier(
        string? primaryName,
        string? alternateId,
        HashSet<string> inventoriedIdentifiers)
    {
        if (!string.IsNullOrWhiteSpace(primaryName) && inventoriedIdentifiers.Contains(primaryName))
            return true;

        if (!string.IsNullOrWhiteSpace(alternateId) && inventoriedIdentifiers.Contains(alternateId))
            return true;

        return false;
    }

    private static bool ProposalIsEmpty(AgentTopologyProposal proposal) =>
        (proposal.AddedServices?.Count ?? 0) == 0
        && (proposal.AddedDatastores?.Count ?? 0) == 0
        && (proposal.AddedRelationships?.Count ?? 0) == 0
        && (proposal.RequiredControls?.Count ?? 0) == 0;

    private static AgentResult CloneWithProposal(AgentResult source, AgentTopologyProposal proposal)
    {
        return new AgentResult
        {
            ResultId = source.ResultId,
            TaskId = source.TaskId,
            RunId = source.RunId,
            AgentType = source.AgentType,
            Claims = source.Claims,
            EvidenceRefs = source.EvidenceRefs,
            Confidence = source.Confidence,
            Findings = source.Findings,
            ProposedChanges = proposal,
            ReasoningTrace = source.ReasoningTrace,
            CreatedUtc = source.CreatedUtc
        };
    }
}
