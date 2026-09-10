namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureRestrictToSharesResponse
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

    public bool ActorAdminShareInserted
    {
        get;
        set;
    }

    public string ConfirmationCopy
    {
        get;
        set;
    } = ArchitectureRestrictToSharesCopy.OptInConfirmation;
}
