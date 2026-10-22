namespace ArchLucid.Core.Authority;

/// <summary>
///     Cross-process-safe (SQL-backed hosts) counting gate for concurrently executing tenant authority pipelines.
/// </summary>
public interface ITenantAuthorityPipelineConcurrencyGate
{
    /// <summary>
    ///     Claims an execution slot for <paramref name="runId" />. Caller must dispose the result to release the slot.
    /// </summary>
    /// <param name="tenantId">Current tenant boundary.</param>
    /// <param name="runId">Run undergoing heavy-stage execution.</param>
    /// <param name="failFastWhenUnavailable">When true, throws when slots are full instead of awaiting.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <exception cref="AuthorityTenantConcurrencyLimitExceededException">
    ///     Raised when <paramref name="failFastWhenUnavailable" /> is set and slots are saturated.
    /// </exception>
    Task<IAsyncDisposable> AcquireExecutionSlotAsync(
        Guid tenantId,
        Guid runId,
        bool failFastWhenUnavailable,
        CancellationToken cancellationToken = default);
}
