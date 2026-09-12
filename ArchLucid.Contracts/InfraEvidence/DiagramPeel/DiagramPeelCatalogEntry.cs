namespace ArchLucid.Contracts.InfraEvidence.DiagramPeel;

/// <summary>One ARM type row in <c>dbo.DiagramPeelCatalogEntry</c> (IE-17 peel budget).</summary>
public sealed class DiagramPeelCatalogEntry
{
    public string ArmResourceType
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Lower peels first. <see langword="null" /> documents a backbone type that must never be peeled.</summary>
    public int? PeelRank
    {
        get;
        init;
    }

    public bool IsEnabled
    {
        get;
        init;
    } = true;

    public string Notes
    {
        get;
        init;
    } = string.Empty;
}
