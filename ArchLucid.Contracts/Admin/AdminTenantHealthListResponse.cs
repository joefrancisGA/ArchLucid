namespace ArchLucid.Contracts.Admin;

public sealed class AdminTenantHealthListResponse
{
    public IReadOnlyList<AdminTenantHealthSummaryItem> Items
    {
        get;
        set;
    } = [];
}
