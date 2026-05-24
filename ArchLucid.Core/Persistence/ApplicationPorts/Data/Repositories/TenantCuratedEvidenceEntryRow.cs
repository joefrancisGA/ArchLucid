namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Projection row from <c>dbo.TenantCuratedEvidenceEntries</c>.</summary>
public sealed class TenantCuratedEvidenceEntryRow
{
    public string EntryType
    {
        get;
        set;
    } = "";

    public string CatalogEntryId
    {
        get;
        set;
    } = "";

    public string Title
    {
        get;
        set;
    } = "";

    public string Description
    {
        get;
        set;
    } = "";

    public string Rationale
    {
        get;
        set;
    } = "";
}
