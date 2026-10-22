using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Creates many architecture runs from one submission, applying batch-level <c>Idempotency-Key</c> replay
///     protection and emitting a single acceptance audit event.
/// </summary>
/// <remarks>
///     Individual items are created through <see cref="IArchitectureRunCreateOrchestrator" /> without their own
///     idempotency state: replay is decided once for the whole batch, so a retry either re-creates nothing or is
///     rejected as a payload mismatch.
/// </remarks>
public interface IArchitectureRunBatchCreateOrchestrator
{
    /// <param name="requests">Submitted items in order; null elements are reported as failed items, not rejected.</param>
    /// <param name="idempotency">Batch-level key and payload fingerprint, or <c>null</c> when no key was supplied.</param>
    /// <param name="correlationId">Request correlation id recorded on the acceptance audit event.</param>
    /// <param name="cancellationToken"></param>
    Task<BatchCreateRunOrchestrationResult> CreateBatchAsync(
        IReadOnlyList<ArchitectureRequest?> requests,
        CreateRunIdempotencyState? idempotency,
        string correlationId,
        CancellationToken cancellationToken = default);
}
