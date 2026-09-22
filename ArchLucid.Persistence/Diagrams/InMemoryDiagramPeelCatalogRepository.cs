using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Core.Diagrams;

namespace ArchLucid.Persistence.Diagrams;

/// <summary>In-memory peel catalog for SQL-disabled hosts.</summary>
public sealed class InMemoryDiagramPeelCatalogRepository : IDiagramPeelCatalogRepository
{
    private readonly object gate = new();
    private readonly List<DiagramPeelCatalogEntry> rows = [];
    private int catalogVersion = DiagramPeelCatalogDefaultSeed.DefaultCatalogVersion;

    public Task<int> CountAsync(CancellationToken cancellationToken)
    {
        lock (gate)
        {
            return Task.FromResult(rows.Count);
        }
    }

    public Task<int> GetCatalogVersionAsync(CancellationToken cancellationToken)
    {
        lock (gate)
        {
            return Task.FromResult(catalogVersion);
        }
    }

    public Task<IReadOnlyList<DiagramPeelCatalogEntry>> ListEntriesAsync(CancellationToken cancellationToken)
    {
        lock (gate)
        {
            return Task.FromResult<IReadOnlyList<DiagramPeelCatalogEntry>>(
                rows.Select(DiagramPeelCatalogRepositoryCore.Clone).ToList());
        }
    }

    public Task UpsertEntryAsync(DiagramPeelCatalogEntry entry, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(entry);

        lock (gate)
        {
            int index = rows.FindIndex(
                candidate => string.Equals(candidate.ArmResourceType, entry.ArmResourceType, StringComparison.OrdinalIgnoreCase));

            if (index >= 0)
            {
                rows[index] = DiagramPeelCatalogRepositoryCore.Clone(entry);
            }
            else
            {
                rows.Add(DiagramPeelCatalogRepositoryCore.Clone(entry));
            }
        }

        return Task.CompletedTask;
    }

    public void SetCatalogVersion(int version)
    {
        lock (gate)
        {
            catalogVersion = version;
        }
    }
}
