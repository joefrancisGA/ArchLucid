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
        if (_memoryCache.TryGetValue(CacheKey, out DiagramPeelCatalogSnapshot? cached) && cached is not null)
        {
            return cached;
        }

        using IServiceScope scope = _scopeFactory.CreateScope();
        IDiagramPeelCatalogRepository catalogRepository =
            scope.ServiceProvider.GetRequiredService<IDiagramPeelCatalogRepository>();

        int count = await catalogRepository.CountAsync(cancellationToken).ConfigureAwait(false);

        DiagramPeelCatalogSnapshot snapshot;

        if (count == 0)
        {
            snapshot = DiagramPeelCatalogDefaultSeed.BuildSnapshot();
        }
        else
        {
            snapshot = new DiagramPeelCatalogSnapshot
            {
                CatalogVersion = await catalogRepository.GetCatalogVersionAsync(cancellationToken).ConfigureAwait(false),
                Entries = await catalogRepository.ListEntriesAsync(cancellationToken).ConfigureAwait(false),
            };
        }

        _memoryCache.Set(CacheKey, snapshot, TimeSpan.FromMinutes(15));

        return snapshot;
    }
}
