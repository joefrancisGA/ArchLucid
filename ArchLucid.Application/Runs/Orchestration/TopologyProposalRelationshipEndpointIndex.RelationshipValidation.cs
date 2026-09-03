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

        string trimmed = endpointKey.Trim();

        if (knownEndpointKeys.Contains(trimmed))
            return true;

        return TopologyProposalEndpointArmKeys.EndpointKeyIsKnownViaArmNormalization(trimmed, knownEndpointKeys);
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
        AddEndpointKey(claimedEndpointKeys, syntheticNodeId);
        TopologyProposalEndpointArmKeys.AddArmResourceIdEndpointKeys(claimedEndpointKeys, id);

        return true;
    }

    private static bool EndpointKeyIsClaimed(string? value, HashSet<string> claimedEndpointKeys) =>
        !string.IsNullOrWhiteSpace(value) && claimedEndpointKeys.Contains(value.Trim());
}
