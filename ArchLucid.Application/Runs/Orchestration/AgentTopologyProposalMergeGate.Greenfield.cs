using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

public static partial class AgentTopologyProposalMergeGate
{
    private static IReadOnlyList<AgentResult> FilterGreenfieldProposals(
        IReadOnlyList<AgentResult> results,
        HashSet<string>? seedEndpointKeys = null)
    {
        HashSet<string> accumulatedEndpointKeys = seedEndpointKeys is { Count: > 0 }
            ? new HashSet<string>(seedEndpointKeys, StringComparer.OrdinalIgnoreCase)
            : new(StringComparer.OrdinalIgnoreCase);
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
}
