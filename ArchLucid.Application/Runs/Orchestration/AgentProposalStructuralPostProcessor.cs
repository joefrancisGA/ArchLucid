using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;

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
            if (result is null || result.ProposedChanges is null)
                continue;

            ApplyToProposal(AgentResultEnvelopeAgentTypeResolver.ResolveAgentType(result), result.ProposedChanges);
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
            return CopyNonNullRelationships(relationships);

        HashSet<string> declaredEndpointKeys = TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(
            proposal.AddedServices ?? [],
            proposal.AddedDatastores ?? []);

        List<ManifestRelationship> retained = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (relationship is null)
                continue;

            if (ShouldRetainDeclaredProposalRelationship(relationship, declaredEndpointKeys))
                retained.Add(relationship);
        }

        return retained;
    }

    private static bool ShouldRetainDeclaredProposalRelationship(
        ManifestRelationship relationship,
        HashSet<string> declaredEndpointKeys)
    {
        bool sourceDeclared = TopologyProposalRelationshipEndpointIndex.DeclaredEndpointKeySetContains(
            declaredEndpointKeys,
            relationship.SourceId);
        bool targetDeclared = TopologyProposalRelationshipEndpointIndex.DeclaredEndpointKeySetContains(
            declaredEndpointKeys,
            relationship.TargetId);

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
            if (service is null)
                continue;

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
            if (datastore is null)
                continue;

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

        ArchitectureRequestBriefGroundingRules rules = BuildBriefGroundingRules(request);

        if (!rules.HasAnyRules)
            return;

        foreach (AgentResult result in results)
        {
            if (result is null || result.ProposedChanges is null)
                continue;

            ApplyBriefGroundingToProposal(
                AgentResultEnvelopeAgentTypeResolver.ResolveAgentType(result),
                result.ProposedChanges,
                rules,
                dropLog);
        }
    }

    private static void ApplyBriefGroundingToProposal(
        AgentType agentType,
        AgentTopologyProposal proposal,
        ArchitectureRequestBriefGroundingRules rules,
        IList<string> dropLog)
    {
        IReadOnlyList<ManifestService> beforeServices = proposal.AddedServices ?? [];
        IReadOnlyList<ManifestDatastore> beforeDatastores = proposal.AddedDatastores ?? [];
        HashSet<string> declaredEndpointKeys = TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(
            beforeServices,
            beforeDatastores);

        List<ManifestService> retainedServices = [];

        foreach (ManifestService service in beforeServices)
        {
            if (service is null)
                continue;

            if (TryDescribeBriefGroundingDrop(service.ServiceName, rules, applyHttpsRule: true, out string? reason))
            {
                dropLog.Add($"Dropped service '{service.ServiceName}' for agent {agentType}: {reason}.");

                continue;
            }

            retainedServices.Add(service);
        }

        proposal.AddedServices = retainedServices;

        List<ManifestDatastore> retainedDatastores = [];

        foreach (ManifestDatastore datastore in beforeDatastores)
        {
            if (datastore is null)
                continue;

            if (TryDescribeBriefGroundingDrop(
                    datastore.DatastoreName,
                    rules,
                    applyHttpsRule: false,
                    out string? reason))
            {
                dropLog.Add($"Dropped datastore '{datastore.DatastoreName}' for agent {agentType}: {reason}.");

                continue;
            }

            retainedDatastores.Add(datastore);
        }

        proposal.AddedDatastores = retainedDatastores;

        PruneRelationshipsAfterGroundingDrops(
            proposal,
            declaredEndpointKeys,
            retainedServices,
            retainedDatastores,
            agentType,
            dropLog);
    }

    private static void PruneRelationshipsAfterGroundingDrops(
        AgentTopologyProposal proposal,
        HashSet<string> declaredEndpointKeysBefore,
        IReadOnlyList<ManifestService> retainedServices,
        IReadOnlyList<ManifestDatastore> retainedDatastores,
        AgentType agentType,
        IList<string> dropLog)
    {
        IReadOnlyList<ManifestRelationship>? relationships = proposal.AddedRelationships;

        if (relationships is null || relationships.Count == 0)
            return;

        HashSet<string> declaredEndpointKeysAfter = TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(
            retainedServices,
            retainedDatastores);

        List<ManifestRelationship> retainedRelationships = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (relationship is null)
                continue;

            bool sourceDeclared = TopologyProposalRelationshipEndpointIndex.DeclaredEndpointKeySetContains(
                declaredEndpointKeysBefore,
                relationship.SourceId);
            bool targetDeclared = TopologyProposalRelationshipEndpointIndex.DeclaredEndpointKeySetContains(
                declaredEndpointKeysBefore,
                relationship.TargetId);
            bool sourceRetained = TopologyProposalRelationshipEndpointIndex.DeclaredEndpointKeySetContains(
                declaredEndpointKeysAfter,
                relationship.SourceId);
            bool targetRetained = TopologyProposalRelationshipEndpointIndex.DeclaredEndpointKeySetContains(
                declaredEndpointKeysAfter,
                relationship.TargetId);

            // An external id was never a proposal node. That must not keep an edge whose other
            // end was a service or datastore that brief grounding just removed.
            bool sourceRemoved = sourceDeclared && !sourceRetained;
            bool targetRemoved = targetDeclared && !targetRetained;

            if (sourceRemoved || targetRemoved)
            {
                dropLog.Add(
                    $"Dropped relationship '{relationship.SourceId}' -> '{relationship.TargetId}' for agent {agentType}: endpoint removed by brief grounding.");

                continue;
            }

            retainedRelationships.Add(relationship);
        }

        proposal.AddedRelationships = retainedRelationships;
    }

    private static bool TryDescribeBriefGroundingDrop(
        string? endpointName,
        ArchitectureRequestBriefGroundingRules rules,
        bool applyHttpsRule,
        out string? reason)
    {
        reason = null;

        if (string.IsNullOrWhiteSpace(endpointName))
            return false;

        string normalizedEndpoint = endpointName.Trim();

        if (applyHttpsRule
            && rules.RequiresHttps
            && BriefGroundingEndpointNameHeuristics.SuggestsPlainHttp(normalizedEndpoint))
        {
            reason = "contradicts confirmed HTTPS constraint";
            return true;
        }

        if (rules.RequiresPrivateNetworking
            && BriefGroundingEndpointNameHeuristics.SuggestsPublicExposure(normalizedEndpoint))
        {
            reason = "contradicts confirmed private-networking constraint";
            return true;
        }

        if (rules.RequiresEncryptionAtRest
            && BriefGroundingEndpointNameHeuristics.SuggestsMissingEncryptionAtRest(normalizedEndpoint))
        {
            reason = "contradicts confirmed encryption-at-rest capability";
            return true;
        }

        return false;
    }

    private static ArchitectureRequestBriefGroundingRules BuildBriefGroundingRules(ArchitectureRequest request)
    {
        // JSON null is a real execute payload. The region enricher already accepts it.
        // This grounding pass runs first and must not abort the batch on a missing list.
        List<string> confirmedConstraints = (request.Constraints ?? [])
            .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
            .Select(static c => c.Trim())
            .ToList();

        List<string> confirmedCapabilities = (request.RequiredCapabilities ?? [])
            .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
            .Select(static c => c.Trim())
            .ToList();

        return ArchitectureRequestBriefGroundingRules.FromConfirmedBriefEntries(
            confirmedConstraints,
            confirmedCapabilities);
    }

    private static List<ManifestRelationship> CopyNonNullRelationships(IReadOnlyList<ManifestRelationship> relationships)
    {
        List<ManifestRelationship> copy = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (relationship is not null)
                copy.Add(relationship);
        }

        return copy;
    }
}
