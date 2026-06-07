namespace ArchLucid.Persistence.Coordination.Projection;

/// <summary>
///     Drains <see cref="IPostCommitProjectionOutboxRepository" /> and executes post-commit projection side effects.
/// </summary>
/// <remarks>Production registration: <c>ArchLucid.Host.Core.Coordination.Projection.PostCommitProjectionOutboxProcessor</c>.</remarks>
public interface IPostCommitProjectionOutboxProcessor
{
    /// <summary>Processes one batch of pending outbox rows (best-effort; failures are logged per row).</summary>
    Task ProcessPendingBatchAsync(CancellationToken ct);
}
