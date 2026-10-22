namespace ArchLucid.Application.Runs;

/// <summary>
///     A commit plus whether an <c>Idempotency-Key</c> made it a replay of an earlier commit, which callers surface as
///     the <c>X-Idempotency-Replayed</c> response header.
/// </summary>
/// <param name="Result">The commit result, whether freshly produced or replayed.</param>
/// <param name="IdempotentReplay">
///     <see langword="true" /> when the key had already recorded a commit for this run, including when a concurrent
///     request recorded it first.
/// </param>
public sealed record CommitRunIdempotencyOutcome(CommitRunResult Result, bool IdempotentReplay);
