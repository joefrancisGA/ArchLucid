using ArchLucid.Contracts.InfraEvidence.DiagramPeel;

namespace ArchLucid.Core.Diagrams;

/// <summary>Global product catalog for inventory diagram peel budget (IE-17).</summary>
public interface IDiagramPeelCatalogRepository
{
    Task<int> CountAsync(CancellationToken cancellationToken);

    Task<int> GetCatalogVersionAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<DiagramPeelCatalogEntry>> ListEntriesAsync(CancellationToken cancellationToken);

    Task UpsertEntryAsync(DiagramPeelCatalogEntry entry, CancellationToken cancellationToken);
}
