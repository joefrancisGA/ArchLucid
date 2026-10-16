using ArchLucid.Contracts.Serialization;

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

    private IReadOnlyList<ArchitectureShareResponse> shares = [];

    public IReadOnlyList<ArchitectureShareResponse> Shares
    {
        get => shares;
        set => shares = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
