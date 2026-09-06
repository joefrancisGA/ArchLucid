namespace ArchLucid.Contracts.Architecture;

/// <summary>Paged architecture identity list with exact total count.</summary>
public sealed class ArchitectureIdentityListResult
{
    public IReadOnlyList<ArchitectureIdentityListItem> Items
    {
        get;
        set;
    } = Array.Empty<ArchitectureIdentityListItem>();

    public int TotalCount
    {
        get;
        set;
    }
}
