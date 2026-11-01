using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

public static partial class TopologyProposalRelationshipEndpointIndex
{
    public static List<ManifestRelationship> FilterKnownRelationships(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores,
        IReadOnlyList<ManifestRelationship>? relationships) =>
        FilterKnownRelationships(null, services, datastores, relationships);

    public static List<ManifestRelationship> FilterKnownRelationships(
        IEnumerable<string>? additionalEndpointKeys,
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores,
        IReadOnlyList<ManifestRelationship>? relationships)
    {
        if (relationships is null || relationships.Count == 0)
            return [];

        HashSet<string> knownEndpointKeys = CollectKnownEndpointKeys(services, datastores);

        if (additionalEndpointKeys is not null)
        {
            foreach (string endpointKey in additionalEndpointKeys)
            {
                AddEndpointKey(knownEndpointKeys, endpointKey);
            }
        }

        List<ManifestRelationship> sanitized = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!RelationshipEndpointsAreKnown(relationship, knownEndpointKeys))
                continue;

            sanitized.Add(relationship);
        }

        return sanitized;
    }

    public static bool RelationshipEndpointsAreKnown(
        ManifestRelationship relationship,
        HashSet<string> knownEndpointKeys) =>
        EndpointKeyIsKnown(relationship.SourceId, knownEndpointKeys)
        && EndpointKeyIsKnown(relationship.TargetId, knownEndpointKeys);

    public static bool EndpointKeyIsKnown(string? endpointKey, HashSet<string> knownEndpointKeys)
    {
        if (string.IsNullOrWhiteSpace(endpointKey))
            return false;

        string trimmed = CanonicalizeTerraformEndpointReferenceForLookup(endpointKey.Trim());

        if (knownEndpointKeys.Contains(trimmed))
            return true;

        if (!string.Equals(trimmed, endpointKey.Trim(), StringComparison.OrdinalIgnoreCase)
            && knownEndpointKeys.Contains(endpointKey.Trim()))
        {
            return true;
        }

        string? normalizedSynthetic =
            NormalizeSyntheticEndpointReference(trimmed);

        if (normalizedSynthetic is not null && knownEndpointKeys.Contains(normalizedSynthetic))
            return true;

        string? terraformEndpointIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(trimmed);

        if (terraformEndpointIdentity is not null && knownEndpointKeys.Contains(terraformEndpointIdentity))
            return true;

        if (EndpointKeyIsKnownViaStrippedTerraformInstanceKey(trimmed, knownEndpointKeys))
            return true;

        return TopologyProposalEndpointArmKeys.EndpointKeyIsKnownViaArmNormalization(trimmed, knownEndpointKeys);
    }

    public static void RegisterRejectedManifestServiceEndpointKeys(
        HashSet<string> rejectedEndpointKeys,
        ManifestService service)
    {
        HashSet<string> rejectedKeys = [];

        AddManifestServiceEndpointKeys(rejectedKeys, service);

        foreach (string rejectedKey in rejectedKeys)
        {
            if (!string.IsNullOrWhiteSpace(rejectedKey))
                rejectedEndpointKeys.Add(rejectedKey);
        }
    }

    public static void RegisterRejectedManifestDatastoreEndpointKeys(
        HashSet<string> rejectedEndpointKeys,
        ManifestDatastore datastore)
    {
        HashSet<string> rejectedKeys = [];

        AddManifestDatastoreEndpointKeys(rejectedKeys, datastore);

        foreach (string rejectedKey in rejectedKeys)
        {
            if (!string.IsNullOrWhiteSpace(rejectedKey))
                rejectedEndpointKeys.Add(rejectedKey);
        }
    }

    public static bool RelationshipReferencesExclusiveRejectedEndpoint(
        ManifestRelationship relationship,
        HashSet<string> rejectedEndpointKeys,
        IReadOnlyList<ManifestService> acceptedServices,
        IReadOnlyList<ManifestDatastore> acceptedDatastores)
    {
        if (rejectedEndpointKeys.Count == 0)
            return false;

        HashSet<string> acceptedIdentityKeys = CollectStrictManifestEndpointIdentityKeys(
            acceptedServices,
            acceptedDatastores);

        return EndpointIsExclusiveRejectedEndpoint(relationship.SourceId, rejectedEndpointKeys, acceptedIdentityKeys)
               || EndpointIsExclusiveRejectedEndpoint(relationship.TargetId, rejectedEndpointKeys, acceptedIdentityKeys);
    }

    public static bool EndpointIsExclusiveRejectedEndpoint(
        string? endpoint,
        HashSet<string> rejectedEndpointKeys,
        HashSet<string> acceptedIdentityKeys)
    {
        if (string.IsNullOrWhiteSpace(endpoint))
            return false;

        if (!EndpointKeyIsKnown(endpoint, rejectedEndpointKeys))
            return false;

        return !EndpointKeyIsKnown(endpoint, acceptedIdentityKeys);
    }

    public static HashSet<string> CollectStrictManifestEndpointIdentityKeys(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores)
    {
        HashSet<string> identityKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestService service in services)
        {
            AddStrictManifestServiceIdentityKeys(identityKeys, service);
        }

        foreach (ManifestDatastore datastore in datastores)
        {
            AddStrictManifestDatastoreIdentityKeys(identityKeys, datastore);
        }

        return identityKeys;
    }

    internal static void AddStrictManifestServiceIdentityKeys(HashSet<string> identityKeys, ManifestService service)
    {
        AddEndpointKey(identityKeys, service.ServiceName);
        AddEndpointKey(identityKeys, service.ServiceId);
        AddSyntheticServiceEndpointKey(identityKeys, service.ServiceName);
    }

    internal static void AddStrictManifestDatastoreIdentityKeys(HashSet<string> identityKeys, ManifestDatastore datastore)
    {
        AddEndpointKey(identityKeys, datastore.DatastoreName);
        AddEndpointKey(identityKeys, datastore.DatastoreId);
        AddSyntheticDatastoreEndpointKey(identityKeys, datastore.DatastoreName);
    }

    private static bool EndpointKeyIsKnownViaStrippedTerraformInstanceKey(
        string trimmed,
        HashSet<string> knownEndpointKeys)
    {
        string? withoutInstanceKey = TerraformAzurermResourceTypeParser.TryStripTrailingInstanceKey(trimmed);

        if (withoutInstanceKey is null)
            return false;

        string? strippedIdentity =
            TopologyProposalTerraformSourceIdHeuristics.TryNormalizeTerraformEndpointIdentity(withoutInstanceKey);

        return strippedIdentity is not null && knownEndpointKeys.Contains(strippedIdentity);
    }

    private static bool TryClaimEndpoint<T>(
        T endpoint,
        HashSet<string> claimedEndpointKeys,
        Func<T, string?> nameSelector,
        Func<T, string?> idSelector,
        Func<string?, string?> syntheticBuilder)
    {
        string? name = nameSelector(endpoint);
        string? id = idSelector(endpoint);

        if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(id))
            return false;

        string? syntheticNodeId = syntheticBuilder(name);

        if (EndpointKeyIsClaimed(name, claimedEndpointKeys)
            || EndpointKeyIsClaimed(id, claimedEndpointKeys)
            || EndpointKeyIsClaimed(syntheticNodeId, claimedEndpointKeys))
        {
            return false;
        }

        AddEndpointKey(claimedEndpointKeys, name);
        AddEndpointKey(claimedEndpointKeys, id);
        TopologyProposalTerraformSourceIdHeuristics.AddTerraformLeafResourceAddressKeys(claimedEndpointKeys, id);
        AddEndpointKey(claimedEndpointKeys, syntheticNodeId);
        TopologyProposalEndpointArmKeys.AddArmResourceIdEndpointKeys(claimedEndpointKeys, id);

        return true;
    }

    private static bool EndpointKeyIsClaimed(string? value, HashSet<string> claimedEndpointKeys) =>
        EndpointKeyIsKnown(value, claimedEndpointKeys);
}
