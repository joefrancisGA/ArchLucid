namespace ArchLucid.Application.SecureNow;

public interface ICollectionRunDiscovery
{
    Task<int> DiscoverAsync(CancellationToken cancellationToken = default);
}
