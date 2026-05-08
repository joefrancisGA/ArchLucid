namespace ArchLucid.Persistence.Coordination.Retrieval;

/// <summary>
///     Drains <see cref="IRetrievalIndexingOutboxRepository" /> and invokes retrieval indexing for each pending run.
/// </summary>
/// <remarks>Production registration: <c>ArchLucid.Host.Core.Coordination.Retrieval.RetrievalIndexingOutboxProcessor</c>.</remarks>
public interface IRetrievalIndexingOutboxProcessor
{
    /// <summary>Processes one batch of pending outbox rows (best-effort; failures are logged per row).</summary>
    Task ProcessPendingBatchAsync(CancellationToken ct);
}
