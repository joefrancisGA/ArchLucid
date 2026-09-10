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

    public IReadOnlyList<ArchitectureShareGrantResponse> Shares
    {
        get;
        set;
    } = [];

    public string ConfirmationCopy
    {
        get;
        set;
    } = ArchitectureRestrictToSharesCopy.OptInConfirmation;
}
