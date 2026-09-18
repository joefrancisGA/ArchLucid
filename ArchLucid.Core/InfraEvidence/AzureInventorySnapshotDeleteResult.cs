namespace ArchLucid.Core.InfraEvidence;

public enum AzureInventorySnapshotDeleteOutcome
{
    Deleted,
    NotFound,
    BlockedBoundToArchitecture,
    BlockedReferencedByAuditEvidence,
    BlockedReferencedByRemediationInstance,
}

public sealed class AzureInventorySnapshotDeleteResult
{
    public AzureInventorySnapshotDeleteOutcome Outcome
    {
        get;
        init;
    }

    public int BlockingReferenceCount
    {
        get;
        init;
    }
}
