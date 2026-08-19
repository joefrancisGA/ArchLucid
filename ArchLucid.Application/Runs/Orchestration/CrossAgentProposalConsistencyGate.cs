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

        HashSet<string> declaredBatchEndpointKeys = CollectDeclaredBatchEndpointKeys(ordered);
        HashSet<string> claimedServiceEndpointKeys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> claimedDatastoreEndpointKeys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> claimedRequiredControls = new(StringComparer.OrdinalIgnoreCase);
        List<ManifestService> acceptedBatchServices = [];
        List<ManifestDatastore> acceptedBatchDatastores = [];

        foreach (AgentResult result in ordered)
        {
            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            proposal.AddedServices = ClaimServices(
                proposal.AddedServices,
                claimedServiceEndpointKeys,
                acceptedBatchServices);
            proposal.AddedDatastores = ClaimDatastores(
                proposal.AddedDatastores,
                claimedDatastoreEndpointKeys,
                acceptedBatchDatastores);
            proposal.RequiredControls = ClaimRequiredControls(proposal.RequiredControls, claimedRequiredControls);
            proposal.AddedRelationships = FilterRelationships(
                declaredBatchEndpointKeys,
                claimedServiceEndpointKeys,
                claimedDatastoreEndpointKeys,
                proposal);
        }
    }

    private static HashSet<string> CollectDeclaredBatchEndpointKeys(IReadOnlyList<AgentResult> orderedResults)
    {
        HashSet<string> endpointKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentResult result in orderedResults)
        {
            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            RegisterDeclaredProposalEndpointKeys(proposal, endpointKeys);
        }

        return endpointKeys;
    }

    private static void RegisterDeclaredProposalEndpointKeys(
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
        HashSet<string> claimedServiceEndpointKeys,
        List<ManifestService> acceptedBatchServices)
    {
        if (services is null || services.Count == 0)
            return [];

        List<ManifestService> accepted = [];

        foreach (ManifestService service in services)
        {
            if (TopologyProposalRelationshipEndpointIndex.TryClaimService(service, claimedServiceEndpointKeys))
            {
                accepted.Add(service);
                acceptedBatchServices.Add(service);
                continue;
            }

            if (TryAcceptRenameAliasService(service, accepted, acceptedBatchServices, claimedServiceEndpointKeys))
                continue;
        }

        return accepted;
    }

    private static List<ManifestDatastore> ClaimDatastores(
        IReadOnlyList<ManifestDatastore>? datastores,
        HashSet<string> claimedDatastoreEndpointKeys,
        List<ManifestDatastore> acceptedBatchDatastores)
    {
        if (datastores is null || datastores.Count == 0)
            return [];

        List<ManifestDatastore> accepted = [];

        foreach (ManifestDatastore datastore in datastores)
        {
            if (TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(datastore, claimedDatastoreEndpointKeys))
            {
                accepted.Add(datastore);
                acceptedBatchDatastores.Add(datastore);
                continue;
            }

            if (TryAcceptRenameAliasDatastore(datastore, accepted, acceptedBatchDatastores, claimedDatastoreEndpointKeys))
                continue;
        }

        return accepted;
    }

    private static bool TryAcceptRenameAliasService(
        ManifestService service,
        List<ManifestService> accepted,
        List<ManifestService> acceptedBatchServices,
        HashSet<string> claimedServiceEndpointKeys)
    {
        if (!TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(service, accepted)
            && !TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(service, acceptedBatchServices))
        {
            return false;
        }

        accepted.Add(service);
        acceptedBatchServices.Add(service);
        TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointKeys(claimedServiceEndpointKeys, service);
        return true;
    }

    private static bool TryAcceptRenameAliasDatastore(
        ManifestDatastore datastore,
        List<ManifestDatastore> accepted,
        List<ManifestDatastore> acceptedBatchDatastores,
        HashSet<string> claimedDatastoreEndpointKeys)
    {
        if (!TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(datastore, accepted)
            && !TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(datastore, acceptedBatchDatastores))
        {
            return false;
        }

        accepted.Add(datastore);
        acceptedBatchDatastores.Add(datastore);
        TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointKeys(claimedDatastoreEndpointKeys, datastore);
        return true;
    }

    private static List<ManifestRelationship> FilterRelationships(
        HashSet<string> declaredBatchEndpointKeys,
        HashSet<string> claimedServiceEndpointKeys,
        HashSet<string> claimedDatastoreEndpointKeys,
        AgentTopologyProposal proposal)
    {
        IReadOnlyList<ManifestRelationship>? relationships = proposal.AddedRelationships;

        if (relationships is null || relationships.Count == 0)
            return [];

        HashSet<string> validationEndpointKeys = new(declaredBatchEndpointKeys, StringComparer.OrdinalIgnoreCase);

        foreach (string endpointKey in claimedServiceEndpointKeys.Concat(claimedDatastoreEndpointKeys))
        {
            if (!string.IsNullOrWhiteSpace(endpointKey))
                validationEndpointKeys.Add(endpointKey);
        }

        if (!ProposalDeclaresEndpoints(proposal))
            return FilterRelationshipOnlyProposals(declaredBatchEndpointKeys, validationEndpointKeys, relationships);

        HashSet<string> declaredEndpointKeys = TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(
            proposal.AddedServices ?? [],
            proposal.AddedDatastores ?? []);

        foreach (string endpointKey in declaredEndpointKeys)
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

    private static List<ManifestRelationship> FilterRelationshipOnlyProposals(
        HashSet<string> declaredBatchEndpointKeys,
        HashSet<string> validationEndpointKeys,
        IReadOnlyList<ManifestRelationship> relationships)
    {
        if (validationEndpointKeys.Count == 0)
            return [.. relationships];

        List<ManifestRelationship> retained = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            bool sourceDeclaredInBatch = declaredBatchEndpointKeys.Contains(relationship.SourceId);
            bool targetDeclaredInBatch = declaredBatchEndpointKeys.Contains(relationship.TargetId);

            // Defer relationships that reference endpoints outside this batch to merge-gate graph validation.
            if (!sourceDeclaredInBatch || !targetDeclaredInBatch)
            {
                retained.Add(relationship);
                continue;
            }

            if (TopologyProposalRelationshipEndpointIndex.RelationshipEndpointsAreKnown(
                    relationship,
                    validationEndpointKeys))
            {
                retained.Add(relationship);
            }
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
