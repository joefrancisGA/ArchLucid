using ArchLucid.Contracts.InfraEvidence.DiagramPeel;

namespace ArchLucid.Core.Diagrams;

/// <summary>Seeds default peel catalog rows when the table is empty (IE-17).</summary>
public sealed class DiagramPeelCatalogBootstrapper(IDiagramPeelCatalogRepository catalogRepository)
{
    private readonly IDiagramPeelCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    public async Task EnsureSeededAsync(CancellationToken cancellationToken)
    {
        int count = await _catalogRepository.CountAsync(cancellationToken).ConfigureAwait(false);

        if (count > 0)
        {
            return;
        }

        foreach (DiagramPeelCatalogEntry entry in DiagramPeelCatalogDefaultSeed.BuildEntries())
        {
            await _catalogRepository.UpsertEntryAsync(entry, cancellationToken).ConfigureAwait(false);
        }
    }
}
