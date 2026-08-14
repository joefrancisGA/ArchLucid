using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Deterministic structural cleanup for agent proposals after LLM execution (LLM proposes, graph/rules verify).
/// </summary>
public static class AgentProposalStructuralPostProcessor
{
    public static void ApplyToResults(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        foreach (AgentResult result in results)
        {
            if (result.ProposedChanges is null)
                continue;

            ApplyToProposal(result.AgentType, result.ProposedChanges);
        }
    }

    public static void ApplyToProposal(AgentType agentType, AgentTopologyProposal proposal)
    {
        ArgumentNullException.ThrowIfNull(proposal);

        proposal.SourceAgent = agentType;
        proposal.AddedServices = DedupeServices(proposal.AddedServices);
        proposal.AddedDatastores = DedupeDatastores(proposal.AddedDatastores);
        proposal.AddedRelationships = FilterRelationships(proposal);

        if (agentType is AgentType.Compliance or AgentType.Critic)
            proposal.RequiredControls = DedupeRequiredControls(proposal.RequiredControls);
    }

    private static List<ManifestRelationship> FilterRelationships(AgentTopologyProposal proposal)
    {
        IReadOnlyList<ManifestRelationship>? relationships = proposal.AddedRelationships;

        if (relationships is null || relationships.Count == 0)
            return [];

        if (!ProposalDeclaresEndpoints(proposal))
            return [.. relationships];

        HashSet<string> declaredEndpointKeys = TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(
            proposal.AddedServices ?? [],
            proposal.AddedDatastores ?? []);

        List<ManifestRelationship> retained = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (ShouldRetainDeclaredProposalRelationship(relationship, declaredEndpointKeys))
                retained.Add(relationship);
        }

        return retained;
    }

    private static bool ShouldRetainDeclaredProposalRelationship(
        ManifestRelationship relationship,
        HashSet<string> declaredEndpointKeys)
    {
        bool sourceDeclared = declaredEndpointKeys.Contains(relationship.SourceId);
        bool targetDeclared = declaredEndpointKeys.Contains(relationship.TargetId);

        if (!sourceDeclared || !targetDeclared)
            return true;

        return TopologyProposalRelationshipEndpointIndex.RelationshipEndpointsAreKnown(
            relationship,
            declaredEndpointKeys);
    }

    private static bool ProposalDeclaresEndpoints(AgentTopologyProposal proposal) =>
        (proposal.AddedServices?.Count ?? 0) > 0 || (proposal.AddedDatastores?.Count ?? 0) > 0;

    private static List<ManifestService> DedupeServices(IReadOnlyList<ManifestService>? services)
    {
        if (services is null || services.Count == 0)
            return [];

        HashSet<string> seenEndpointKeys = new(StringComparer.OrdinalIgnoreCase);
        List<ManifestService> deduped = [];

        foreach (ManifestService service in services)
        {
            if (!TopologyProposalRelationshipEndpointIndex.TryClaimService(service, seenEndpointKeys))
                continue;

            deduped.Add(service);
        }

        return deduped;
    }

    private static List<ManifestDatastore> DedupeDatastores(IReadOnlyList<ManifestDatastore>? datastores)
    {
        if (datastores is null || datastores.Count == 0)
            return [];

        HashSet<string> seenEndpointKeys = new(StringComparer.OrdinalIgnoreCase);
        List<ManifestDatastore> deduped = [];

        foreach (ManifestDatastore datastore in datastores)
        {
            if (!TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(datastore, seenEndpointKeys))
                continue;

            deduped.Add(datastore);
        }

        return deduped;
    }

    private static List<string> DedupeRequiredControls(IReadOnlyList<string>? requiredControls)
    {
        if (requiredControls is null || requiredControls.Count == 0)
            return [];

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<string> deduped = [];

        foreach (string control in requiredControls)
        {
            if (string.IsNullOrWhiteSpace(control))
                continue;

            string trimmed = control.Trim();

            if (!seen.Add(trimmed))
                continue;

            deduped.Add(trimmed);
        }

        return deduped;
    }
}
