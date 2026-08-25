using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

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
            if (TopologyEndpointSources.Service.TryClaim(service, seenEndpointKeys))
            {
                deduped.Add(service);
                continue;
            }

            if (TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(service, deduped))
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
            if (TopologyEndpointSources.Datastore.TryClaim(datastore, seenEndpointKeys))
            {
                deduped.Add(datastore);
                continue;
            }

            if (TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(datastore, deduped))
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

    /// <summary>
    ///     Drops proposal nodes that contradict confirmed structured-brief constraints (TB-2349).
    /// </summary>
    public static void ApplyBriefGrounding(
        ArchitectureRequest request,
        IReadOnlyList<AgentResult> results,
        IList<string> dropLog)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(dropLog);

        List<string> confirmedConstraints = request.Constraints
            .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
            .Select(static c => c.Trim())
            .ToList();

        if (confirmedConstraints.Count == 0)
            return;

        foreach (AgentResult result in results)
        {
            if (result.ProposedChanges is null)
                continue;

            AgentTopologyProposal proposal = result.ProposedChanges;
            List<ManifestService> retainedServices = [];

            foreach (ManifestService service in proposal.AddedServices ?? [])
            {
                if (ContradictsConfirmedConstraints(service.ServiceName, confirmedConstraints))
                {
                    dropLog.Add(
                        $"Dropped service '{service.ServiceName}' for agent {result.AgentType}: contradicts confirmed constraint.");

                    continue;
                }

                retainedServices.Add(service);
            }

            proposal.AddedServices = retainedServices;
        }
    }

    private static bool ContradictsConfirmedConstraints(string serviceName, IReadOnlyList<string> confirmedConstraints)
    {
        if (string.IsNullOrWhiteSpace(serviceName))
            return false;

        string normalizedService = serviceName.Trim();

        foreach (string constraint in confirmedConstraints)
        {
            if (ConstraintRequiresHttps(constraint)
                && normalizedService.Contains("http", StringComparison.OrdinalIgnoreCase)
                && !normalizedService.Contains("https", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (ConstraintRequiresPrivateNetworking(constraint)
                && normalizedService.Contains("public", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static bool ConstraintRequiresHttps(string constraint) =>
        constraint.Contains("https", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("tls", StringComparison.OrdinalIgnoreCase);

    private static bool ConstraintRequiresPrivateNetworking(string constraint) =>
        constraint.Contains("private", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("vnet", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("private endpoint", StringComparison.OrdinalIgnoreCase);
}
