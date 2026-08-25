using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Claims topology endpoint keys for a manifest service or datastore during proposal merge.
/// </summary>
public interface ITopologyEndpointSource
{
    bool TryClaim(object endpoint, HashSet<string> claimedEndpointKeys);
}

/// <summary>Well-known topology endpoint sources for service and datastore proposals.</summary>
public static class TopologyEndpointSources
{
    public static readonly ITopologyEndpointSource Service = new ServiceTopologyEndpointSource();

    public static readonly ITopologyEndpointSource Datastore = new DatastoreTopologyEndpointSource();
}

/// <summary>Claims endpoint keys for <see cref="ManifestService"/> proposals.</summary>
public sealed class ServiceTopologyEndpointSource : ITopologyEndpointSource
{
    public bool TryClaim(object endpoint, HashSet<string> claimedEndpointKeys)
    {
        if (endpoint is not ManifestService service)
            return false;

        return TopologyProposalRelationshipEndpointIndex.TryClaimService(service, claimedEndpointKeys);
    }
}

/// <summary>Claims endpoint keys for <see cref="ManifestDatastore"/> proposals.</summary>
public sealed class DatastoreTopologyEndpointSource : ITopologyEndpointSource
{
    public bool TryClaim(object endpoint, HashSet<string> claimedEndpointKeys)
    {
        if (endpoint is not ManifestDatastore datastore)
            return false;

        return TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(datastore, claimedEndpointKeys);
    }
}
