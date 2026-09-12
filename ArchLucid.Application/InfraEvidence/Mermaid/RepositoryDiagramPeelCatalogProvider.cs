using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Core.Diagrams;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Loads peel catalog from <see cref="IDiagramPeelCatalogRepository" /> with process cache.</summary>
public sealed class RepositoryDiagramPeelCatalogProvider(
    IDiagramPeelCatalogRepository catalogRepository,
    IMemoryCache memoryCache) : IDiagramPeelCatalogProvider
{
    private const string CacheKey = "diagram-peel-catalog-snapshot-v1";

    private readonly IDiagramPeelCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    public async Task<DiagramPeelCatalogSnapshot> GetCatalogAsync(CancellationToken cancellationToken = default)
    {
        if (_memoryCache.TryGetValue(CacheKey, out DiagramPeelCatalogSnapshot? cached) && cached is not null)
        {
            return cached;
        }

        int count = await _catalogRepository.CountAsync(cancellationToken).ConfigureAwait(false);

        DiagramPeelCatalogSnapshot snapshot;

        if (count == 0)
        {
            snapshot = DiagramPeelCatalogDefaultSeed.BuildSnapshot();
        }
        else
        {
            snapshot = new DiagramPeelCatalogSnapshot
            {
                CatalogVersion = await _catalogRepository.GetCatalogVersionAsync(cancellationToken).ConfigureAwait(false),
                Entries = await _catalogRepository.ListEntriesAsync(cancellationToken).ConfigureAwait(false),
            };
        }

        _memoryCache.Set(CacheKey, snapshot, TimeSpan.FromMinutes(15));

        return snapshot;
    }
}
