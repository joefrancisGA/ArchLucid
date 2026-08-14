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
            if (TopologyProposalRelationshipEndpointIndex.TryClaimService(service, claimedServiceEndpointKeys))
            {
                accepted.Add(service);
                continue;
            }

            if (TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(service, accepted))
            {
                accepted.Add(service);
                TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointKeys(claimedServiceEndpointKeys, service);
            }
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
            if (TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(datastore, claimedDatastoreEndpointKeys))
            {
                accepted.Add(datastore);
                continue;
            }

            if (TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(datastore, accepted))
            {
                accepted.Add(datastore);
                TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointKeys(claimedDatastoreEndpointKeys, datastore);
            }
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

        HashSet<string> declaredEndpointKeys = TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(
            proposal.AddedServices ?? [],
            proposal.AddedDatastores ?? []);

        HashSet<string> validationEndpointKeys = new(declaredEndpointKeys, StringComparer.OrdinalIgnoreCase);

        foreach (string endpointKey in priorClaimedEndpointKeys)
        {
            if (!string.IsNullOrWhiteSpace(endpointKey))
                validationEndpointKeys.Add(endpointKey);
        }

        List<ManifestRelationship> retained = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (ShouldRetainDeclaredProposalRelationship(relationship, declaredEndpointKeys, validationEndpointKeys))
                retained.Add(relationship);
        }

        return retained;
    }

    private static bool ShouldRetainDeclaredProposalRelationship(
        ManifestRelationship relationship,
        HashSet<string> declaredEndpointKeys,
        HashSet<string> validationEndpointKeys)
    {
        bool sourceDeclared = declaredEndpointKeys.Contains(relationship.SourceId);
        bool targetDeclared = declaredEndpointKeys.Contains(relationship.TargetId);

        if (!sourceDeclared || !targetDeclared)
            return true;

        return TopologyProposalRelationshipEndpointIndex.RelationshipEndpointsAreKnown(
            relationship,
            validationEndpointKeys);
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
