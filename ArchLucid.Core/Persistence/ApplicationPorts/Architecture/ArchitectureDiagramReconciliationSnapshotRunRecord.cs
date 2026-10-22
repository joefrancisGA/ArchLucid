namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class ArchitectureDiagramReconciliationSnapshotRunRecord
{
    public Guid SnapshotId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }
}
