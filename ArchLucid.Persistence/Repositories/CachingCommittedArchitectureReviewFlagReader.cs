using ArchLucid.Core.Authority;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Decorates <see cref="ICommittedArchitectureReviewFlagReader" /> with hot-path read caching for
///     <c>GET /api/auth/me</c> — keyed by scope + run-list revision so first commit invalidates promptly.
/// </summary>
public sealed class CachingCommittedArchitectureReviewFlagReader(
    ICommittedArchitectureReviewFlagReader inner,
    IHotPathReadCache hotPathReadCache) : ICommittedArchitectureReviewFlagReader
{
    /// <summary>Matches UI/proxy <c>/me</c> private cache (60s).</summary>
    private const int AbsoluteExpirationSeconds = 60;

    private readonly ICommittedArchitectureReviewFlagReader _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    /// <inheritdoc />
    public async Task<bool> TenantHasCommittedArchitectureReviewAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        long revision = await ReadRunListScopeRevisionAsync(scope, cancellationToken);
        string key = HotPathCacheKeys.CommittedArchitectureReviewFlag(scope, revision);

        CommittedArchitectureReviewFlagCacheEntry? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                bool hasCommitted =
                    await _inner.TenantHasCommittedArchitectureReviewAsync(scope, innerCt);

                return new CommittedArchitectureReviewFlagCacheEntry { HasCommitted = hasCommitted };
            },
            cancellationToken,
            absoluteExpirationSecondsOverride: AbsoluteExpirationSeconds);

        return cached?.HasCommitted ?? false;
    }

    private async Task<long> ReadRunListScopeRevisionAsync(ScopeContext scope, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.RunListScopeRevision(scope);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
    }
}
