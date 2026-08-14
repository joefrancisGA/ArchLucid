using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Enforces multi-agent proposal coherence using deterministic merge precedence (topology → cost → compliance → critic).
/// </summary>
public static class CrossAgentProposalConsistencyGate
{
    public static void ApplyToResults(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        List<AgentResult> ordered = results
            .OrderBy(static result => GetMergeOrder(result.AgentType))
            .ToList();

        HashSet<string> claimedServiceEndpointKeys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> claimedDatastoreEndpointKeys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> claimedRequiredControls = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentResult result in ordered)
        {
            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            proposal.AddedServices = ClaimServices(proposal.AddedServices, claimedServiceEndpointKeys);
            proposal.AddedDatastores = ClaimDatastores(proposal.AddedDatastores, claimedDatastoreEndpointKeys);
            proposal.RequiredControls = ClaimRequiredControls(proposal.RequiredControls, claimedRequiredControls);
            proposal.AddedRelationships = FilterRelationships(
                claimedServiceEndpointKeys,
                claimedDatastoreEndpointKeys,
                proposal);
        }
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

    private static List<ManifestService> ClaimServices(
        IReadOnlyList<ManifestService>? services,
        HashSet<string> claimedServiceEndpointKeys)
    {
        if (services is null || services.Count == 0)
            return [];

        List<ManifestService> accepted = [];

        foreach (ManifestService service in services)
        {
            if (!TopologyProposalRelationshipEndpointIndex.TryClaimService(service, claimedServiceEndpointKeys))
                continue;

            accepted.Add(service);
        }

        return accepted;
    }

    private static List<ManifestDatastore> ClaimDatastores(
        IReadOnlyList<ManifestDatastore>? datastores,
        HashSet<string> claimedDatastoreEndpointKeys)
    {
        if (datastores is null || datastores.Count == 0)
            return [];

        List<ManifestDatastore> accepted = [];

        foreach (ManifestDatastore datastore in datastores)
        {
            if (!TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(datastore, claimedDatastoreEndpointKeys))
                continue;

            accepted.Add(datastore);
        }

        return accepted;
    }

    private static List<ManifestRelationship> FilterRelationships(
        HashSet<string> claimedServiceEndpointKeys,
        HashSet<string> claimedDatastoreEndpointKeys,
        AgentTopologyProposal proposal)
    {
        IReadOnlyList<ManifestRelationship>? relationships = proposal.AddedRelationships;

        if (relationships is null || relationships.Count == 0)
            return [];

        IEnumerable<string> priorClaimedEndpointKeys = claimedServiceEndpointKeys.Concat(claimedDatastoreEndpointKeys);

        if (!ProposalDeclaresEndpoints(proposal))
        {
            if (!priorClaimedEndpointKeys.Any())
                return [.. relationships];

            return TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
                priorClaimedEndpointKeys,
                proposal.AddedServices ?? [],
                proposal.AddedDatastores ?? [],
                relationships);
        }

        return TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            priorClaimedEndpointKeys,
            proposal.AddedServices,
            proposal.AddedDatastores,
            relationships);
    }

    private static bool ProposalDeclaresEndpoints(AgentTopologyProposal proposal) =>
        (proposal.AddedServices?.Count ?? 0) > 0 || (proposal.AddedDatastores?.Count ?? 0) > 0;

    private static List<string> ClaimRequiredControls(
        IReadOnlyList<string>? requiredControls,
        HashSet<string> claimedRequiredControls)
    {
        if (requiredControls is null || requiredControls.Count == 0)
            return [];

        List<string> accepted = [];

        foreach (string control in requiredControls)
        {
            if (string.IsNullOrWhiteSpace(control))
                continue;

            string trimmed = control.Trim();

            if (!claimedRequiredControls.Add(trimmed))
                continue;

            accepted.Add(trimmed);
        }

        return accepted;
    }
}
