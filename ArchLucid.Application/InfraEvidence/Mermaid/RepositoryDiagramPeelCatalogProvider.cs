using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Core.Diagrams;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Loads peel catalog from <see cref="IDiagramPeelCatalogRepository" /> with process cache.</summary>
public sealed class RepositoryDiagramPeelCatalogProvider(
    IServiceScopeFactory scopeFactory,
    IMemoryCache memoryCache) : IDiagramPeelCatalogProvider
{
    private const string CacheKey = "diagram-peel-catalog-snapshot-v1";

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    public async Task<DiagramPeelCatalogSnapshot> GetCatalogAsync(CancellationToken cancellationToken = default)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        IDiagramPeelCatalogRepository catalogRepository =
            scope.ServiceProvider.GetRequiredService<IDiagramPeelCatalogRepository>();

        int count = await catalogRepository.CountAsync(cancellationToken).ConfigureAwait(false);

        if (count == 0)
        {
            // Do not cache the read-time default seed: a later repository upsert must be visible on the next read.
            _memoryCache.Remove(CacheKey);

            return DiagramPeelCatalogDefaultSeed.BuildSnapshot();
        }

        int catalogVersion = await catalogRepository.GetCatalogVersionAsync(cancellationToken).ConfigureAwait(false);
        string versionedCacheKey = $"{CacheKey}:{catalogVersion}";

        if (_memoryCache.TryGetValue(versionedCacheKey, out DiagramPeelCatalogSnapshot? cached) && cached is not null)
        {
            return cached;
        }

        DiagramPeelCatalogSnapshot snapshot = new()
        {
            CatalogVersion = catalogVersion,
            Entries = await catalogRepository.ListEntriesAsync(cancellationToken).ConfigureAwait(false),
        };

        _memoryCache.Set(versionedCacheKey, snapshot, TimeSpan.FromMinutes(15));

        return snapshot;
    }
}
