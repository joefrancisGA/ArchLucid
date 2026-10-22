using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

public static partial class TopologyProposalRelationshipEndpointIndex
{
    public static Dictionary<string, string> BuildDeclaredEndpointCanonicalMap(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores)
    {
        Dictionary<string, string> endpointToCanonical = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestService service in services)
            AddDeclaredManifestServiceEndpointAliases(endpointToCanonical, service);

        foreach (ManifestDatastore datastore in datastores)
            AddDeclaredManifestDatastoreEndpointAliases(endpointToCanonical, datastore);

        return endpointToCanonical;
    }
}
