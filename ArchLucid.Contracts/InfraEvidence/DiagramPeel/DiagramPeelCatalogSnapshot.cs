namespace ArchLucid.Contracts.InfraEvidence.DiagramPeel;

/// <summary>Versioned peel catalog loaded for inventory diagram compile (IE-17).</summary>
public sealed class DiagramPeelCatalogSnapshot
{
    public int CatalogVersion
    {
        get;
        init;
    } = 1;

    public IReadOnlyList<DiagramPeelCatalogEntry> Entries
    {
        get;
        init;
    } = [];
}
