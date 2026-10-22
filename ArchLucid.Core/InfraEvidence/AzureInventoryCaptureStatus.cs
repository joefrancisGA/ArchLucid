namespace ArchLucid.Core.InfraEvidence;

/// <summary>Lifecycle of an <see cref="AzureInventorySnapshotRecord"/> materialization.</summary>
public enum AzureInventoryCaptureStatus
{
    Pending = 0,
    Succeeded = 1,
    Partial = 2,
    Failed = 3,
}
