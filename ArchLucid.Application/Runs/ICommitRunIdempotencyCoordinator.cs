namespace ArchLucid.Application.Runs;

/// <summary>
///     Applies <c>Idempotency-Key</c> replay semantics around a run commit so HTTP callers hold only the header and
///     the response, not the lookup/record ordering.
/// </summary>
public interface ICommitRunIdempotencyCoordinator
{
    /// <summary>
    ///     Runs <paramref name="commitAsync" /> under the given idempotency <paramref name="state" />, reporting whether
    ///     the key had already recorded a commit for this run.
    /// </summary>
    /// <param name="state">Idempotency state, or <see langword="null" /> when the caller sent no key.</param>
    /// <param name="commitAsync">The commit to perform; invoked exactly once.</param>
    /// <param name="cancellationToken">Cancels the lookup, the commit, and the record.</param>
    /// <exception cref="ConflictException">
    ///     The key was already recorded for this run against a different request body.
    /// </exception>
    Task<CommitRunIdempotencyOutcome> CommitAsync(
        CommitRunIdempotencyState? state,
        Func<CancellationToken, Task<CommitRunResult>> commitAsync,
        CancellationToken cancellationToken = default);
}
