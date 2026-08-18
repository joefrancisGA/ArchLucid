using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

public static class TopologyProposalConsensusMerger
{
    public static TopologyProposalConsensusMergeResult Merge(
        AgentTopologyProposal primary,
        AgentTopologyProposal secondary)
    {
        ArgumentNullException.ThrowIfNull(primary);
        ArgumentNullException.ThrowIfNull(secondary);

        List<ManifestService> intersectedServices = IntersectServices(primary.AddedServices, secondary.AddedServices);
        List<ManifestDatastore> intersectedDatastores = IntersectDatastores(primary.AddedDatastores, secondary.AddedDatastores);
        List<ManifestRelationship> intersectedRelationships =
            IntersectRelationships(primary.AddedRelationships, secondary.AddedRelationships);
        List<string> intersectedControls = IntersectControls(primary.RequiredControls, secondary.RequiredControls);

        int disagreementCount =
            (primary.AddedServices.Count - intersectedServices.Count)
            + (secondary.AddedServices.Count - intersectedServices.Count)
            + (primary.AddedDatastores.Count - intersectedDatastores.Count)
            + (secondary.AddedDatastores.Count - intersectedDatastores.Count)
            + (primary.AddedRelationships.Count - intersectedRelationships.Count)
            + (secondary.AddedRelationships.Count - intersectedRelationships.Count)
            + (primary.RequiredControls.Count - intersectedControls.Count)
            + (secondary.RequiredControls.Count - intersectedControls.Count);

        AgentTopologyProposal merged = new()
        {
            ProposalId = primary.ProposalId,
            SourceAgent = primary.SourceAgent,
            AddedServices = intersectedServices,
            AddedDatastores = intersectedDatastores,
            AddedRelationships = intersectedRelationships,
            RequiredControls = intersectedControls,
            Warnings = new List<string>(primary.Warnings),
        };

        if (disagreementCount > 0)
        {
            merged.Warnings.Add(
                $"Topology dual-model consensus: {disagreementCount} element(s) disagreed between models; intersection auto-accepted; human review recommended.");
        }

        return new TopologyProposalConsensusMergeResult(merged, disagreementCount);
    }

    private static List<ManifestService> IntersectServices(
        IReadOnlyList<ManifestService> primary,
        IReadOnlyList<ManifestService> secondary)
    {
        HashSet<string> secondaryKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestService service in secondary)
            secondaryKeys.Add(ServiceKey(service));

        List<ManifestService> intersection = [];

        foreach (ManifestService service in primary)
        {
            if (secondaryKeys.Contains(ServiceKey(service)))
                intersection.Add(service);
        }

        return intersection;
    }

    private static List<ManifestDatastore> IntersectDatastores(
        IReadOnlyList<ManifestDatastore> primary,
        IReadOnlyList<ManifestDatastore> secondary)
    {
        HashSet<string> secondaryKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestDatastore datastore in secondary)
            secondaryKeys.Add(DatastoreKey(datastore));

        List<ManifestDatastore> intersection = [];

        foreach (ManifestDatastore datastore in primary)
        {
            if (secondaryKeys.Contains(DatastoreKey(datastore)))
                intersection.Add(datastore);
        }

        return intersection;
    }

    private static List<ManifestRelationship> IntersectRelationships(
        IReadOnlyList<ManifestRelationship> primary,
        IReadOnlyList<ManifestRelationship> secondary)
    {
        HashSet<string> secondaryKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestRelationship relationship in secondary)
            secondaryKeys.Add(RelationshipKey(relationship));

        List<ManifestRelationship> intersection = [];

        foreach (ManifestRelationship relationship in primary)
        {
            if (secondaryKeys.Contains(RelationshipKey(relationship)))
                intersection.Add(relationship);
        }

        return intersection;
    }

    private static List<string> IntersectControls(IReadOnlyList<string> primary, IReadOnlyList<string> secondary)
    {
        HashSet<string> secondaryControls = new(secondary, StringComparer.OrdinalIgnoreCase);
        List<string> intersection = [];

        foreach (string control in primary)
        {
            if (secondaryControls.Contains(control))
                intersection.Add(control);
        }

        return intersection;
    }

    private static string ServiceKey(ManifestService service) =>
        $"{service.ServiceName}|{service.ServiceType}|{service.RuntimePlatform}";

    private static string DatastoreKey(ManifestDatastore datastore) =>
        $"{datastore.DatastoreName}|{datastore.DatastoreType}";

    private static string RelationshipKey(ManifestRelationship relationship) =>
        $"{relationship.SourceId}|{relationship.TargetId}|{relationship.RelationshipType}";
}
