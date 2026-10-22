using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventorySnapshotHeaderCreateResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public bool WasExisting
    {
        get;
        init;
    }

    public Guid? SnapshotId
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public interface IAzureInventorySnapshotHeaderService
{
    Task<AzureInventorySnapshotHeaderCreateResult> TryCreatePendingFromPackageAsync(
        ScopeContext scope,
        Guid packageId,
        string? subscriptionId,
        string? subscriptionName,
        DateTime? capturedUtc,
        string? captureVersion,
        string? collectorVersion,
        string requestedBy,
        bool allowRecapture,
        CancellationToken cancellationToken = default);
}
