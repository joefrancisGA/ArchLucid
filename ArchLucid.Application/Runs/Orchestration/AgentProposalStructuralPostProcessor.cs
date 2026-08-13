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
        proposal.AddedRelationships = SanitizeRelationships(
            proposal.AddedServices,
            proposal.AddedDatastores,
            proposal.AddedRelationships);

        if (agentType is AgentType.Compliance or AgentType.Critic)
            proposal.RequiredControls = DedupeRequiredControls(proposal.RequiredControls);
    }

    private static List<ManifestService> DedupeServices(IReadOnlyList<ManifestService>? services)
    {
        if (services is null || services.Count == 0)
            return [];

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<ManifestService> deduped = [];

        foreach (ManifestService service in services)
        {
            if (string.IsNullOrWhiteSpace(service.ServiceName))
                continue;

            if (!seen.Add(service.ServiceName))
                continue;

            deduped.Add(service);
        }

        return deduped;
    }

    private static List<ManifestDatastore> DedupeDatastores(IReadOnlyList<ManifestDatastore>? datastores)
    {
        if (datastores is null || datastores.Count == 0)
            return [];

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<ManifestDatastore> deduped = [];

        foreach (ManifestDatastore datastore in datastores)
        {
            if (string.IsNullOrWhiteSpace(datastore.DatastoreName))
                continue;

            if (!seen.Add(datastore.DatastoreName))
                continue;

            deduped.Add(datastore);
        }

        return deduped;
    }

    private static List<ManifestRelationship> SanitizeRelationships(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores,
        IReadOnlyList<ManifestRelationship>? relationships)
    {
        if (relationships is null || relationships.Count == 0)
            return [];

        HashSet<string> knownLabels = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestService service in services)
        {
            if (!string.IsNullOrWhiteSpace(service.ServiceName))
                knownLabels.Add(service.ServiceName);
        }

        foreach (ManifestDatastore datastore in datastores)
        {
            if (!string.IsNullOrWhiteSpace(datastore.DatastoreName))
                knownLabels.Add(datastore.DatastoreName);
        }

        List<ManifestRelationship> sanitized = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            bool sourceKnown = knownLabels.Contains(relationship.SourceId);
            bool targetKnown = knownLabels.Contains(relationship.TargetId);

            if (sourceKnown && targetKnown)
                sanitized.Add(relationship);
        }

        return sanitized;
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
