using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence.DiagramPeel;

/// <summary>Versioned peel catalog loaded for inventory diagram compile (IE-17).</summary>
public sealed class DiagramPeelCatalogSnapshot
{
    public int CatalogVersion
    {
        get;
        init;
    } = 1;

    private IReadOnlyList<DiagramPeelCatalogEntry> entries = [];

    public IReadOnlyList<DiagramPeelCatalogEntry> Entries
    {
        get => entries;
        init => entries = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
