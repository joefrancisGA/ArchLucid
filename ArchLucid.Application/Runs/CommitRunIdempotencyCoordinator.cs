using System.Security.Cryptography;

using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Runs;

/// <inheritdoc cref="ICommitRunIdempotencyCoordinator" />
public sealed class CommitRunIdempotencyCoordinator(ICommitRunIdempotencyRepository commitRunIdempotencyRepository)
    : ICommitRunIdempotencyCoordinator
{
    private readonly ICommitRunIdempotencyRepository _commitRunIdempotencyRepository =
        commitRunIdempotencyRepository ?? throw new ArgumentNullException(nameof(commitRunIdempotencyRepository));

    /// <inheritdoc />
    public async Task<CommitRunIdempotencyOutcome> CommitAsync(
        CommitRunIdempotencyState? state,
        Func<CancellationToken, Task<CommitRunResult>> commitAsync,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(commitAsync);

        if (state is null)
            return new CommitRunIdempotencyOutcome(await commitAsync(cancellationToken), false);

        // Read before committing so a key reused with a different body is rejected instead of quietly producing a
        // second manifest for the same run.
        bool replayed = await WasAlreadyRecordedAsync(state, cancellationToken);

        CommitRunResult result = await commitAsync(cancellationToken);

        bool recorded = await _commitRunIdempotencyRepository.TryInsertAsync(
            state.TenantId,
            state.WorkspaceId,
            state.ProjectId,
            state.CanonicalRunKey,
            state.IdempotencyKeyHash,
            state.RequestFingerprint,
            cancellationToken);

        // A rejected insert means a concurrent request recorded the same key first, which is a replay rather than a
        // failure: both callers committed the same body under the same key.
        if (!recorded)
            replayed = true;

        return new CommitRunIdempotencyOutcome(result, replayed);
    }

    private async Task<bool> WasAlreadyRecordedAsync(
        CommitRunIdempotencyState state,
        CancellationToken cancellationToken)
    {
        CommitRunIdempotencyLookup? lookup = await _commitRunIdempotencyRepository.TryGetAsync(
            state.TenantId,
            state.WorkspaceId,
            state.ProjectId,
            state.CanonicalRunKey,
            state.IdempotencyKeyHash,
            cancellationToken);

        if (lookup is null)
            return false;

        // Fixed-time compare because the fingerprint decides whether a caller may replay someone else's commit.
        if (!CryptographicOperations.FixedTimeEquals(lookup.RequestFingerprint, state.RequestFingerprint))
            throw new ConflictException("Idempotency-Key was reused with a different request payload.");

        return true;
    }
}
