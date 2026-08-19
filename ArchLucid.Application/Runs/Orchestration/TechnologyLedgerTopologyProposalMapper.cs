using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Costing;

namespace ArchLucid.Application.Runs.Orchestration;

public static class TechnologyLedgerTopologyProposalMapper
{
    private const string AgentProposalRationale = "Proposed by Topology agent in ProposedChanges.";

    public static IReadOnlyList<TechnologyLedgerEntry> MapCandidates(
        string runId,
        ArchitectureRequest request,
        AgentTopologyProposal proposal,
        DateTime utcNow)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(proposal);

        if (proposal.AddedServices.Count == 0 && proposal.AddedDatastores.Count == 0)
            return [];

        string proposalId = string.IsNullOrWhiteSpace(proposal.ProposalId) ? "unknown" : proposal.ProposalId;
        List<TechnologyLedgerEntry> candidates = [];

        foreach (ManifestDatastore datastore in proposal.AddedDatastores)
        {
            CloudProvider family = RuntimePlatformCloudFamily.ResolveCloudFamily(datastore.RuntimePlatform);
            string technologyName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
                ? datastore.RuntimePlatform.ToString()
                : datastore.DatastoreName;
            string subKey = Slug(string.IsNullOrWhiteSpace(datastore.DatastoreId) ? technologyName : datastore.DatastoreId);
            candidates.Add(CreateCandidate(runId, TechnologyLedgerRole.PrimaryDatastore, technologyName, family, proposalId, subKey, utcNow));
        }

        foreach (ManifestService service in proposal.AddedServices)
        {
            CloudProvider family = RuntimePlatformCloudFamily.ResolveCloudFamily(service.RuntimePlatform);
            string technologyName = string.IsNullOrWhiteSpace(service.ServiceName)
                ? service.RuntimePlatform.ToString()
                : service.ServiceName;
            string subKey = Slug(string.IsNullOrWhiteSpace(service.ServiceId) ? technologyName : service.ServiceId);
            candidates.Add(CreateCandidate(runId, TechnologyLedgerRole.ComputeRuntime, technologyName, family, proposalId, subKey, utcNow));
        }

        (string? region, CloudProvider regionFamily) = ResolveRegion(proposal);

        if (!string.IsNullOrWhiteSpace(region))
            candidates.Add(CreateCandidate(runId, TechnologyLedgerRole.Region, region, regionFamily, proposalId, Slug(region), utcNow));

        if (!candidates.Any(entry => entry.Role == TechnologyLedgerRole.CloudPlatform))
        {
            CloudProvider inferredFamily = InferMajorityCloudFamily(proposal, request);
            candidates.Add(CreateCandidate(
                runId,
                TechnologyLedgerRole.CloudPlatform,
                ResolveCloudPlatformLabel(inferredFamily),
                inferredFamily,
                proposalId,
                "cloud-platform",
                utcNow));
        }

        return candidates;
    }

    private static (string? Region, CloudProvider Family) ResolveRegion(AgentTopologyProposal proposal)
    {
        foreach (ManifestService service in proposal.AddedServices)
        {
            if (!string.IsNullOrWhiteSpace(service.AzureArmRegion))
                return (service.AzureArmRegion, RuntimePlatformCloudFamily.ResolveCloudFamily(service.RuntimePlatform));
        }

        foreach (ManifestDatastore datastore in proposal.AddedDatastores)
        {
            if (!string.IsNullOrWhiteSpace(datastore.AzureArmRegion))
                return (datastore.AzureArmRegion, RuntimePlatformCloudFamily.ResolveCloudFamily(datastore.RuntimePlatform));
        }

        return (null, CloudProvider.None);
    }

    private static CloudProvider InferMajorityCloudFamily(AgentTopologyProposal proposal, ArchitectureRequest request)
    {
        List<CloudProvider> families = proposal.AddedServices
            .Select(service => RuntimePlatformCloudFamily.ResolveCloudFamily(service.RuntimePlatform))
            .Concat(proposal.AddedDatastores.Select(datastore =>
                RuntimePlatformCloudFamily.ResolveCloudFamily(datastore.RuntimePlatform)))
            .Where(family => family != CloudProvider.None)
            .ToList();

        if (families.Count == 0)
            return request.CloudProvider;

        return families.GroupBy(family => family).OrderByDescending(group => group.Count()).ThenBy(group => group.Key).First().Key;
    }

    private static string ResolveCloudPlatformLabel(CloudProvider provider) => provider switch
    {
        CloudProvider.Azure => "Microsoft Azure",
        CloudProvider.Aws => "Amazon Web Services",
        CloudProvider.Gcp => "Google Cloud Platform",
        _ => "Cloud-neutral (no specific provider)",
    };

    private static TechnologyLedgerEntry CreateCandidate(
        string runId,
        TechnologyLedgerRole role,
        string technologyName,
        CloudProvider providerFamily,
        string proposalId,
        string stableSubKey,
        DateTime utcNow) =>
        new()
        {
            RunId = runId,
            Role = role,
            TechnologyName = technologyName,
            ProviderFamily = providerFamily,
            Status = TechnologyLedgerStatus.Assumed,
            Source = TechnologyLedgerSource.AgentProposed,
            EvidenceRef = $"agentTopologyProposal:{proposalId}:{stableSubKey}",
            Rationale = AgentProposalRationale,
            IsLocked = false,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static string Slug(string value)
    {
        string trimmed = value.Trim();
        return trimmed.Length == 0 ? "unknown" : trimmed.ToLowerInvariant().Replace(" ", "-", StringComparison.Ordinal);
    }
}
