using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

public class InventoryReconciliationFindingPayload
{
    public int GraphTopologyResourceCount
    {
        get;
        set;
    }

    public int InventoryResourceCount
    {
        get;
        set;
    }

    private List<string> graphOnlyResourceIds = [];

    public List<string> GraphOnlyResourceIds
    {
        get => graphOnlyResourceIds;
        set => graphOnlyResourceIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> inventoryOnlyResourceIds = [];

    public List<string> InventoryOnlyResourceIds
    {
        get => inventoryOnlyResourceIds;
        set => inventoryOnlyResourceIds = ContractCollectionDefaults.Coalesce(value);
    }
}
