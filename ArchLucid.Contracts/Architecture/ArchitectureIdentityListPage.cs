namespace ArchLucid.Contracts.Architecture;

/// <summary>Paged architecture identity list with optional archived-hidden metadata (CA-49).</summary>
public sealed class ArchitectureIdentityListPage
{
    public IReadOnlyList<ArchitectureIdentityListItem> Items
    {
        get;
        init;
    } = [];

    public int TotalCount
    {
        get;
        init;
    }

    public int Page
    {
        get;
        init;
    } = 1;

    public int PageSize
    {
        get;
        init;
    } = 50;

    public bool HasMore => Page * PageSize < TotalCount;

    /// <summary>Archived identities excluded when <c>includeArchived</c> is false.</summary>
    public int ArchivedHiddenCount
    {
        get;
        init;
    }
}
