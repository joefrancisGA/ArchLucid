using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Authorization;

/// <summary>
///     Decorates <see cref="ICustomRoleRepository" /> for claims-transform hot paths
///     (<see cref="ICustomRoleRepository.ListAssignmentsForUserAsync" />).
/// </summary>
public sealed class CachingCustomRoleRepository(ICustomRoleRepository inner, IHotPathReadCache hotPathReadCache)
    : ICustomRoleRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ICustomRoleRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task<IReadOnlyList<CustomRoleRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        long revision = await ReadTenantRevisionAsync(tenantId, cancellationToken);
        string key = HotPathCacheKeys.CustomRoleListByTenant(tenantId, revision);

        CachedCustomRoleList? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<CustomRoleRecord> rows = await _inner.ListByTenantAsync(tenantId, innerCt);

                return new CachedCustomRoleList { Items = rows.ToList() };
            },
            cancellationToken);

        return cached?.Items ?? [];
    }

    /// <inheritdoc />
    public async Task<CustomRoleRecord?> TryGetAsync(
        Guid tenantId,
        Guid roleId,
        CancellationToken cancellationToken)
    {
        long revision = await ReadTenantRevisionAsync(tenantId, cancellationToken);
        string key = HotPathCacheKeys.CustomRoleById(tenantId, roleId, revision);

        return await _hotPathReadCache.GetOrCreateAsync(
            key,
            innerCt => _inner.TryGetAsync(tenantId, roleId, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<CustomRoleRecord> CreateAsync(CustomRoleRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        CustomRoleRecord created = await _inner.CreateAsync(record, cancellationToken);
        await HotPathCacheEviction.InvalidateCustomRoleTenantAsync(_hotPathReadCache, record.TenantId, cancellationToken);

        return created;
    }

    /// <inheritdoc />
    public async Task<CustomRoleRecord> UpdateAsync(CustomRoleRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        CustomRoleRecord updated = await _inner.UpdateAsync(record, cancellationToken);
        await HotPathCacheEviction.InvalidateCustomRoleTenantAsync(_hotPathReadCache, record.TenantId, cancellationToken);

        return updated;
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken)
    {
        await _inner.DeleteAsync(tenantId, roleId, cancellationToken);
        await HotPathCacheEviction.InvalidateCustomRoleTenantAsync(_hotPathReadCache, tenantId, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CustomRoleAssignmentWithRole>> ListAssignmentsForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        long revision = await ReadTenantRevisionAsync(tenantId, cancellationToken);
        string key = HotPathCacheKeys.CustomRoleAssignmentsForUser(tenantId, userId, revision);

        CachedCustomRoleAssignmentList? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
            {
                IReadOnlyList<CustomRoleAssignmentWithRole> rows =
                    await _inner.ListAssignmentsForUserAsync(tenantId, userId, innerCt);

                return new CachedCustomRoleAssignmentList { Items = rows.ToList() };
            },
            cancellationToken);

        return cached?.Items ?? [];
    }

    /// <inheritdoc />
    public async Task AssignAsync(UserCustomRoleAssignmentRecord assignment, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(assignment);

        await _inner.AssignAsync(assignment, cancellationToken);

        if (assignment.TenantId != Guid.Empty)
        {
            await HotPathCacheEviction.InvalidateCustomRoleTenantAsync(
                _hotPathReadCache,
                assignment.TenantId,
                cancellationToken);
        }
    }

    /// <inheritdoc />
    public async Task RemoveAssignmentAsync(
        Guid tenantId,
        Guid userId,
        Guid customRoleId,
        CancellationToken cancellationToken)
    {
        await _inner.RemoveAssignmentAsync(tenantId, userId, customRoleId, cancellationToken);
        await HotPathCacheEviction.InvalidateCustomRoleTenantAsync(_hotPathReadCache, tenantId, cancellationToken);
    }

    /// <inheritdoc />
    public async Task EnsureBuiltInRolesSeededAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await _inner.EnsureBuiltInRolesSeededAsync(tenantId, cancellationToken);
        await HotPathCacheEviction.InvalidateCustomRoleTenantAsync(_hotPathReadCache, tenantId, cancellationToken);
    }

    private async Task<long> ReadTenantRevisionAsync(Guid tenantId, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.CustomRoleTenantRevision(tenantId);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
    }
}

/// <summary>Concrete list wrapper so HybridCache can round-trip role rows.</summary>
public sealed class CachedCustomRoleList
{
    public List<CustomRoleRecord> Items
    {
        get;
        init;
    } = [];
}

/// <summary>Concrete list wrapper so HybridCache can round-trip assignment rows.</summary>
public sealed class CachedCustomRoleAssignmentList
{
    public List<CustomRoleAssignmentWithRole> Items
    {
        get;
        init;
    } = [];
}
