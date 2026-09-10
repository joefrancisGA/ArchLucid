namespace ArchLucid.Contracts.Architecture;

public sealed class SetArchitectureRestrictToSharesRequest
{
    public bool RestrictToShares
    {
        get;
        set;
    }

    /// <summary>Required when <see cref="RestrictToShares" /> is true (AS-089).</summary>
    public bool ConfirmOptIn
    {
        get;
        set;
    }
}
