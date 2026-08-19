namespace ArchLucid.Persistence.Coordination.Export;

/// <summary>
///     Drains <see cref="IRunExportBlobPushOutboxRepository" /> and uploads run export ZIPs to customer blob destinations.
/// </summary>
/// <remarks>Production registration: <c>ArchLucid.Host.Core.Coordination.Export.RunExportBlobPushOutboxProcessor</c>.</remarks>
public interface IRunExportBlobPushOutboxProcessor
{
    /// <summary>
    ///     Processes one batch of pending outbox rows (best-effort; failures are logged per row).
    ///     Returns the number of rows dequeued so the host loop can adapt its poll cadence.
    /// </summary>
    Task<int> ProcessPendingBatchAsync(CancellationToken ct);
}
