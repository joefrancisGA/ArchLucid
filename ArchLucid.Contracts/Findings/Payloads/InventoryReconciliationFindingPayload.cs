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

    public List<string> GraphOnlyResourceIds
    {
        get;
        set;
    } = [];

    public List<string> InventoryOnlyResourceIds
    {
        get;
        set;
    } = [];
}
