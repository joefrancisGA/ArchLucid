using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Governance;

/// <summary>
///     Decorates <see cref="IPolicyPackRepository" /> with hot-path reads for
///     <see cref="IPolicyPackRepository.GetByIdAsync" /> and first-page
///     <see cref="IPolicyPackRepository.ListByScopeAsync" /> (TB-581).
/// </summary>
public sealed class CachingPolicyPackRepository(IPolicyPackRepository inner, IHotPathReadCache hotPathReadCache)
    : IPolicyPackRepository
{
    /// <summary>Short TTL for policy-pack list; scope revision bump invalidates on writes (TB-581).</summary>
    private const int ListAbsoluteExpirationSeconds = 15;

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IPolicyPackRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task CreateAsync(
        PolicyPack pack,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.CreateAsync(pack, ct, connection, transaction);

        await HotPathCacheEviction.RemovePolicyPackAsync(_hotPathReadCache, pack.PolicyPackId, ct);
        await HotPathCacheEviction.InvalidatePolicyPackListScopeAsync(_hotPathReadCache, ScopeForPack(pack), ct);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(PolicyPack pack, CancellationToken ct)
    {
        await _inner.UpdateAsync(pack, ct);

        await HotPathCacheEviction.RemovePolicyPackAsync(_hotPathReadCache, pack.PolicyPackId, ct);
        await HotPathCacheEviction.InvalidatePolicyPackListScopeAsync(_hotPathReadCache, ScopeForPack(pack), ct);
    }

    /// <inheritdoc />
    public Task<PolicyPack?> GetByIdAsync(Guid policyPackId, CancellationToken ct)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.PolicyPack(policyPackId),
            innerCt => _inner.GetByIdAsync(policyPackId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PolicyPack>> GetByIdsAsync(IReadOnlyCollection<Guid> policyPackIds, CancellationToken ct)
    {
        if (policyPackIds is null || policyPackIds.Count == 0)
            return Array.Empty<PolicyPack>();

        List<Guid> distinctIds = policyPackIds.Distinct().ToList();
        IReadOnlyList<PolicyPack> loaded =
            await _inner.GetByIdsAsync(distinctIds, ct).ConfigureAwait(false) ?? Array.Empty<PolicyPack>();

        foreach (PolicyPack pack in loaded)
        {
            await _hotPathReadCache.GetOrCreateAsync(
                HotPathCacheKeys.PolicyPack(pack.PolicyPackId),
                innerCt => Task.FromResult<PolicyPack?>(pack),
                ct).ConfigureAwait(false);
        }

        return loaded;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PolicyPack>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        long revision = await ReadPolicyPackListScopeRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.PolicyPackListByScope(scope, revision);

        IReadOnlyList<PolicyPack>? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<PolicyPack> rows =
                    await _inner.ListByScopeAsync(tenantId, workspaceId, projectId, innerCt);

                return rows;
            },
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? [];
    }

    private async Task<long> ReadPolicyPackListScopeRevisionAsync(ScopeContext scope, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.PolicyPackListScopeRevision(scope);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
    }

    private static ScopeContext ScopeForPack(PolicyPack pack)
    {
        ArgumentNullException.ThrowIfNull(pack);

        return new ScopeContext
        {
            TenantId = pack.TenantId,
            WorkspaceId = pack.WorkspaceId,
            ProjectId = pack.ProjectId,
        };
    }
}
