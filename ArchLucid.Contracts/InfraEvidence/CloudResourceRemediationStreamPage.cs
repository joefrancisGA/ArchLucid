using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceRemediationStreamPage
{
    public int Page
    {
        get;
        set;
    }

    public int PageSize
    {
        get;
        set;
    }

    public int TotalCount
    {
        get;
        set;
    }

    public bool HasMore
    {
        get;
        set;
    }

    private List<CloudResourceRemediationHubItem> items = [];

    public List<CloudResourceRemediationHubItem> Items
    {
        get => items;
        set => items = ContractCollectionDefaults.Coalesce(value);
    }
}
