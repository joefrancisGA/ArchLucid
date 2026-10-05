using ArchLucid.Application.Analysis;
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
            PruneRelationshipsToDeclaredEndpoints(
                intersectedServices,
                intersectedDatastores,
                IntersectRelationships(
                    primary.AddedRelationships,
                    secondary.AddedRelationships,
                    primary.AddedServices,
                    primary.AddedDatastores,
                    secondary.AddedServices,
                    secondary.AddedDatastores));
        List<string> intersectedControls = IntersectControls(
            primary.RequiredControls ?? [],
            secondary.RequiredControls ?? []);

        int disagreementCount =
            (primary.AddedServices.Count - intersectedServices.Count)
            + (secondary.AddedServices.Count - intersectedServices.Count)
            + (primary.AddedDatastores.Count - intersectedDatastores.Count)
            + (secondary.AddedDatastores.Count - intersectedDatastores.Count)
            + (primary.AddedRelationships.Count - intersectedRelationships.Count)
            + (secondary.AddedRelationships.Count - intersectedRelationships.Count)
            + ((primary.RequiredControls?.Count ?? 0) - intersectedControls.Count)
            + ((secondary.RequiredControls?.Count ?? 0) - intersectedControls.Count);

        AgentTopologyProposal merged = new()
        {
            ProposalId = primary.ProposalId,
            SourceAgent = primary.SourceAgent,
            AddedServices = intersectedServices,
            AddedDatastores = intersectedDatastores,
            AddedRelationships = intersectedRelationships,
            RequiredControls = intersectedControls,
            Warnings = primary.Warnings is null ? [] : new List<string>(primary.Warnings),
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
        HashSet<string> seenIntersectionKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestService service in primary)
        {
            string key = ServiceKey(service);

            if (!secondaryKeys.Contains(key) || !seenIntersectionKeys.Add(key))
                continue;

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
        HashSet<string> seenIntersectionKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestDatastore datastore in primary)
        {
            string key = DatastoreKey(datastore);

            if (!secondaryKeys.Contains(key) || !seenIntersectionKeys.Add(key))
                continue;

            intersection.Add(datastore);
        }

        return intersection;
    }

    private static List<ManifestRelationship> IntersectRelationships(
        IReadOnlyList<ManifestRelationship> primary,
        IReadOnlyList<ManifestRelationship> secondary,
        IReadOnlyList<ManifestService> primaryServices,
        IReadOnlyList<ManifestDatastore> primaryDatastores,
        IReadOnlyList<ManifestService> secondaryServices,
        IReadOnlyList<ManifestDatastore> secondaryDatastores)
    {
        Dictionary<string, string> endpointCanonicalMap =
            TopologyProposalRelationshipEndpointIndex.BuildDeclaredEndpointCanonicalMap(
                CombineManifestServices(primaryServices, secondaryServices),
                CombineManifestDatastores(primaryDatastores, secondaryDatastores));

        HashSet<string> knownEndpointKeys =
            TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(
                CombineManifestServices(primaryServices, secondaryServices),
                CombineManifestDatastores(primaryDatastores, secondaryDatastores));

        HashSet<string> secondaryKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestRelationship relationship in secondary)
            secondaryKeys.Add(RelationshipKey(relationship, endpointCanonicalMap, knownEndpointKeys));

        List<ManifestRelationship> intersection = [];
        HashSet<string> seenIntersectionKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestRelationship relationship in primary)
        {
            string key = RelationshipKey(relationship, endpointCanonicalMap, knownEndpointKeys);

            if (!secondaryKeys.Contains(key) || !seenIntersectionKeys.Add(key))
                continue;

            intersection.Add(relationship);
        }

        return intersection;
    }

    private static List<ManifestService> CombineManifestServices(
        IReadOnlyList<ManifestService> primary,
        IReadOnlyList<ManifestService> secondary)
    {
        if (primary.Count == 0)
            return secondary.Count == 0 ? [] : new List<ManifestService>(secondary);

        if (secondary.Count == 0)
            return new List<ManifestService>(primary);

        List<ManifestService> combined = new(primary.Count + secondary.Count);
        combined.AddRange(primary);
        combined.AddRange(secondary);
        return combined;
    }

    private static List<ManifestDatastore> CombineManifestDatastores(
        IReadOnlyList<ManifestDatastore> primary,
        IReadOnlyList<ManifestDatastore> secondary)
    {
        if (primary.Count == 0)
            return secondary.Count == 0 ? [] : new List<ManifestDatastore>(secondary);

        if (secondary.Count == 0)
            return new List<ManifestDatastore>(primary);

        List<ManifestDatastore> combined = new(primary.Count + secondary.Count);
        combined.AddRange(primary);
        combined.AddRange(secondary);
        return combined;
    }

    private static List<string> IntersectControls(IReadOnlyList<string> primary, IReadOnlyList<string> secondary)
    {
        HashSet<string> secondaryControls = new(StringComparer.OrdinalIgnoreCase);

        foreach (string control in secondary ?? [])
        {
            if (string.IsNullOrWhiteSpace(control))
                continue;

            secondaryControls.Add(control.Trim());
        }

        List<string> intersection = [];
        HashSet<string> seenIntersection = new(StringComparer.OrdinalIgnoreCase);

        foreach (string control in primary)
        {
            if (string.IsNullOrWhiteSpace(control))
                continue;

            string trimmed = control.Trim();

            if (!secondaryControls.Contains(trimmed) || !seenIntersection.Add(trimmed))
                continue;

            intersection.Add(trimmed);
        }

        return intersection;
    }

    private static string ServiceKey(ManifestService service) =>
        $"{ResolveServiceIdentity(service)}|{service.ServiceType}|{service.RuntimePlatform}";

    private static string DatastoreKey(ManifestDatastore datastore) =>
        $"{ResolveDatastoreIdentity(datastore)}|{datastore.DatastoreType}";

    private static string ResolveServiceIdentity(ManifestService service)
    {
        if (!string.IsNullOrWhiteSpace(service.ServiceId))
            return service.ServiceId.Trim();

        return string.IsNullOrWhiteSpace(service.ServiceName) ? string.Empty : service.ServiceName.Trim();
    }

    private static string ResolveDatastoreIdentity(ManifestDatastore datastore)
    {
        if (!string.IsNullOrWhiteSpace(datastore.DatastoreId))
            return datastore.DatastoreId.Trim();

        return string.IsNullOrWhiteSpace(datastore.DatastoreName) ? string.Empty : datastore.DatastoreName.Trim();
    }

    private static string RelationshipKey(
        ManifestRelationship relationship,
        Dictionary<string, string> endpointCanonicalMap,
        HashSet<string> knownEndpointKeys) =>
        $"{CanonicalizeConsensusRelationshipEndpoint(relationship.SourceId, endpointCanonicalMap, knownEndpointKeys)}|{CanonicalizeConsensusRelationshipEndpoint(relationship.TargetId, endpointCanonicalMap, knownEndpointKeys)}|{relationship.RelationshipType}";

    private static string CanonicalizeConsensusRelationshipEndpoint(
        string? endpoint,
        Dictionary<string, string> endpointCanonicalMap,
        HashSet<string> knownEndpointKeys)
    {
        if (string.IsNullOrWhiteSpace(endpoint))
            return string.Empty;

        string trimmed = endpoint.Trim();
        string? terraformEndpointIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(trimmed);

        if (terraformEndpointIdentity is not null)
        {
            if (endpointCanonicalMap.TryGetValue(terraformEndpointIdentity, out string? terraformCanonical))
                return terraformCanonical;

            if (endpointCanonicalMap.TryGetValue(trimmed, out terraformCanonical))
                return terraformCanonical;

            if (TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown(terraformEndpointIdentity, knownEndpointKeys))
                return terraformEndpointIdentity;
        }

        string normalizedSynthetic =
            TopologyProposalRelationshipEndpointIndex.NormalizeSyntheticEndpointReference(trimmed)
            ?? trimmed;

        if (endpointCanonicalMap.TryGetValue(normalizedSynthetic, out string? canonical))
            return canonical;

        if (endpointCanonicalMap.TryGetValue(trimmed, out canonical))
            return canonical;

        if (TopologyProposalEndpointArmKeys.EndpointKeyIsKnownViaArmNormalization(trimmed, knownEndpointKeys))
            return GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(trimmed);

        if (TopologyProposalEndpointArmKeys.EndpointKeyIsKnownViaArmNormalization(normalizedSynthetic, knownEndpointKeys))
            return GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(normalizedSynthetic);

        if (TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown(trimmed, knownEndpointKeys))
            return normalizedSynthetic;

        return normalizedSynthetic;
    }

    private static List<ManifestRelationship> PruneRelationshipsToDeclaredEndpoints(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores,
        IReadOnlyList<ManifestRelationship> relationships)
    {
        if (relationships.Count == 0)
            return [];

        HashSet<string> endpointKeys =
            TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(services, datastores);

        if (endpointKeys.Count == 0)
            return [];

        List<ManifestRelationship> pruned = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!TopologyProposalRelationshipEndpointIndex.RelationshipEndpointsAreKnown(relationship, endpointKeys))
                continue;

            pruned.Add(relationship);
        }

        return pruned;
    }
}
