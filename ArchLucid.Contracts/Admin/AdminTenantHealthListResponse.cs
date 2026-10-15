using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Admin;

public sealed class AdminTenantHealthListResponse
{
    private IReadOnlyList<AdminTenantHealthSummaryItem> items = [];

    public IReadOnlyList<AdminTenantHealthSummaryItem> Items
    {
        get => items;
        set => items = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
