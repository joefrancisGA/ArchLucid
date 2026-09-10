namespace ArchLucid.Contracts.Architecture;

public sealed class PatchArchitectureRestrictToSharesRequest
{
    public bool RestrictToShares
    {
        get;
        set;
    }

    /// <summary>Operator confirms restrict-to-shares hides the package from unshared workspace members.</summary>
    public bool ConfirmRestrict
    {
        get;
        set;
    }
}
