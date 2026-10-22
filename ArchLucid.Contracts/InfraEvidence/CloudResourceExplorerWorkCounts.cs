namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceExplorerWorkCounts
{
    public int OpenOperationalFindingsCount
    {
        get;
        set;
    }

    public int OpenRemediationInstancesCount
    {
        get;
        set;
    }

    public int InventoryDriftChangeCount
    {
        get;
        set;
    }
}
