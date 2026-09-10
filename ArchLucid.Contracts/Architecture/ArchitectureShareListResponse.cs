namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureShareListResponse
{
    public Guid ArchitectureId
    {
        get;
        set;
    }

    public bool RestrictToShares
    {
        get;
        set;
    }

    public IReadOnlyList<ArchitectureShareResponse> Shares
    {
        get;
        set;
    } = [];
}
