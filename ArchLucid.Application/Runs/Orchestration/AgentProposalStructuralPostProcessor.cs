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

        BriefGroundingRules rules = BriefGroundingRules.FromRequest(request);

        if (!rules.HasAnyRules)
            return;

        foreach (AgentResult result in results)
        {
            if (result.ProposedChanges is null)
                continue;

            ApplyBriefGroundingToProposal(result.AgentType, result.ProposedChanges, rules, dropLog);
        }
    }

    private static void ApplyBriefGroundingToProposal(
        AgentType agentType,
        AgentTopologyProposal proposal,
        BriefGroundingRules rules,
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
            bool sourceDeclared = declaredEndpointKeysBefore.Contains(relationship.SourceId);
            bool targetDeclared = declaredEndpointKeysBefore.Contains(relationship.TargetId);

            if (!sourceDeclared || !targetDeclared)
            {
                retainedRelationships.Add(relationship);
                continue;
            }

            bool sourceRetained = declaredEndpointKeysAfter.Contains(relationship.SourceId);
            bool targetRetained = declaredEndpointKeysAfter.Contains(relationship.TargetId);

            if (sourceRetained && targetRetained)
            {
                retainedRelationships.Add(relationship);
                continue;
            }

            dropLog.Add(
                $"Dropped relationship '{relationship.SourceId}' -> '{relationship.TargetId}' for agent {agentType}: endpoint removed by brief grounding.");
        }

        proposal.AddedRelationships = retainedRelationships;
    }

    private static bool TryDescribeBriefGroundingDrop(
        string? endpointName,
        BriefGroundingRules rules,
        bool applyHttpsRule,
        out string? reason)
    {
        reason = null;

        if (string.IsNullOrWhiteSpace(endpointName))
            return false;

        string normalizedEndpoint = endpointName.Trim();

        if (applyHttpsRule
            && rules.RequiresHttps
            && normalizedEndpoint.Contains("http", StringComparison.OrdinalIgnoreCase)
            && !normalizedEndpoint.Contains("https", StringComparison.OrdinalIgnoreCase))
        {
            reason = "contradicts confirmed HTTPS constraint";
            return true;
        }

        if (rules.RequiresPrivateNetworking
            && normalizedEndpoint.Contains("public", StringComparison.OrdinalIgnoreCase))
        {
            reason = "contradicts confirmed private-networking constraint";
            return true;
        }

        if (rules.RequiresEncryptionAtRest
            && EndpointSuggestsMissingEncryptionAtRest(normalizedEndpoint))
        {
            reason = "contradicts confirmed encryption-at-rest capability";
            return true;
        }

        return false;
    }

    private static bool EndpointSuggestsMissingEncryptionAtRest(string endpointName) =>
        endpointName.Contains("plaintext", StringComparison.OrdinalIgnoreCase)
        || endpointName.Contains("unencrypted", StringComparison.OrdinalIgnoreCase);

    private static bool ConstraintRequiresHttps(string constraint) =>
        constraint.Contains("https", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("tls", StringComparison.OrdinalIgnoreCase);

    private static bool ConstraintRequiresPrivateNetworking(string constraint) =>
        constraint.Contains("private", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("vnet", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("private endpoint", StringComparison.OrdinalIgnoreCase);

    private static bool CapabilityRequiresEncryptionAtRest(string capability) =>
        capability.Contains("encryption", StringComparison.OrdinalIgnoreCase)
        && capability.Contains("rest", StringComparison.OrdinalIgnoreCase);

    private sealed record BriefGroundingRules(
        bool RequiresHttps,
        bool RequiresPrivateNetworking,
        bool RequiresEncryptionAtRest)
    {
        public bool HasAnyRules =>
            RequiresHttps || RequiresPrivateNetworking || RequiresEncryptionAtRest;

        public static BriefGroundingRules FromRequest(ArchitectureRequest request)
        {
            List<string> confirmedConstraints = request.Constraints
                .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
                .Select(static c => c.Trim())
                .ToList();

            List<string> confirmedCapabilities = request.RequiredCapabilities
                .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
                .Select(static c => c.Trim())
                .ToList();

            return new BriefGroundingRules(
                confirmedConstraints.Any(ConstraintRequiresHttps),
                confirmedConstraints.Any(ConstraintRequiresPrivateNetworking),
                confirmedCapabilities.Any(CapabilityRequiresEncryptionAtRest));
        }
    }
}
