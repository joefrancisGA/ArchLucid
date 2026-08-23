namespace ArchLucid.Contracts.Governance.Posture;

public sealed class ArchitecturePillarCatalogEntry
{
    public string PillarKey
    {
        get;
        init;
    } = null!;

    public string DisplayName
    {
        get;
        init;
    } = null!;

    public int DisplayOrder
    {
        get;
        init;
    }

    public bool IsReviewIntegrityAxis
    {
        get;
        init;
    }
}
