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

        HashSet<string> claimedServiceNames = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> claimedDatastoreNames = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> claimedRequiredControls = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentResult result in ordered)
        {
            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            proposal.AddedServices = ClaimServices(proposal.AddedServices, claimedServiceNames);
            proposal.AddedDatastores = ClaimDatastores(proposal.AddedDatastores, claimedDatastoreNames);
            proposal.RequiredControls = ClaimRequiredControls(proposal.RequiredControls, claimedRequiredControls);
            proposal.AddedRelationships = SanitizeRelationships(
                proposal.AddedServices,
                proposal.AddedDatastores,
                proposal.AddedRelationships);
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
        HashSet<string> claimedServiceNames)
    {
        if (services is null || services.Count == 0)
            return [];

        List<ManifestService> accepted = [];

        foreach (ManifestService service in services)
        {
            if (string.IsNullOrWhiteSpace(service.ServiceName))
                continue;

            if (!claimedServiceNames.Add(service.ServiceName))
                continue;

            accepted.Add(service);
        }

        return accepted;
    }

    private static List<ManifestDatastore> ClaimDatastores(
        IReadOnlyList<ManifestDatastore>? datastores,
        HashSet<string> claimedDatastoreNames)
    {
        if (datastores is null || datastores.Count == 0)
            return [];

        List<ManifestDatastore> accepted = [];

        foreach (ManifestDatastore datastore in datastores)
        {
            if (string.IsNullOrWhiteSpace(datastore.DatastoreName))
                continue;

            if (!claimedDatastoreNames.Add(datastore.DatastoreName))
                continue;

            accepted.Add(datastore);
        }

        return accepted;
    }

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
}
