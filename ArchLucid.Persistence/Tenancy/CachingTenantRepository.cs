using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Decorates <see cref="ITenantDirectoryReader.GetByIdAsync" /> for erasure-quarantine middleware and other hot reads.
/// </summary>
public sealed partial class CachingTenantRepository(ITenantRepository inner, IHotPathReadCache hotPathReadCache)
    : ITenantRepository, IWorkspaceQueryTenantRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ITenantRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantById(tenantId),
            innerCt => _inner.GetByIdAsync(tenantId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public Task<TenantRecord?> GetByIdFromControlPlaneCatalogAsync(Guid tenantId, CancellationToken ct) =>
        _inner.GetByIdFromControlPlaneCatalogAsync(tenantId, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetBySlugFromControlPlaneCatalogAsync(string slug, CancellationToken ct) =>
        _inner.GetBySlugFromControlPlaneCatalogAsync(slug, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetByNormalizedOrganizationNameAsync(
        string normalizedOrganizationName,
        CancellationToken ct) =>
        _inner.GetByNormalizedOrganizationNameAsync(normalizedOrganizationName, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken ct) =>
        _inner.GetBySlugAsync(slug, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetByEntraTenantIdAsync(Guid entraTenantId, CancellationToken ct) =>
        _inner.GetByEntraTenantIdAsync(entraTenantId, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<TenantRecord>> ListAsync(CancellationToken ct) => _inner.ListAsync(ct);

    /// <inheritdoc />
    public async Task InsertTenantAsync(
        Guid tenantId,
        string name,
        string slug,
        TenantTier tier,
        Guid? entraTenantId,
        string dataRegion,
        CancellationToken ct,
        int? enterpriseScimSeatsLimit = null)
    {
        await _inner.InsertTenantAsync(
            tenantId,
            name,
            slug,
            tier,
            entraTenantId,
            dataRegion,
            ct,
            enterpriseScimSeatsLimit);

        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public Task<bool> WorkspaceExistsAsync(Guid tenantId, Guid workspaceId, CancellationToken ct) =>
        _inner is IWorkspaceQueryTenantRepository q
            ? q.WorkspaceExistsAsync(tenantId, workspaceId, ct)
            : WorkspaceExistsFallbackAsync(tenantId, workspaceId, ct);

    /// <inheritdoc />
    public Task<TenantWorkspaceListItem?> GetWorkspaceByIdAsync(Guid tenantId, Guid workspaceId, CancellationToken ct) =>
        _inner is IWorkspaceQueryTenantRepository q
            ? q.GetWorkspaceByIdAsync(tenantId, workspaceId, ct)
            : GetWorkspaceByIdFallbackAsync(tenantId, workspaceId, ct);

    private async Task<bool> WorkspaceExistsFallbackAsync(Guid tenantId, Guid workspaceId, CancellationToken ct)
    {
        IReadOnlyList<TenantWorkspaceListItem> workspaces = await _inner.ListWorkspacesAsync(tenantId, ct).ConfigureAwait(false);
        return workspaces.Any(w => w.WorkspaceId == workspaceId);
    }

    private async Task<TenantWorkspaceListItem?> GetWorkspaceByIdFallbackAsync(Guid tenantId, Guid workspaceId, CancellationToken ct)
    {
        IReadOnlyList<TenantWorkspaceListItem> workspaces = await _inner.ListWorkspacesAsync(tenantId, ct).ConfigureAwait(false);
        return workspaces.FirstOrDefault(w => w.WorkspaceId == workspaceId);
    }

    /// <inheritdoc />
    public Task InsertWorkspaceAsync(
        Guid workspaceId,
        Guid tenantId,
        string name,
        Guid defaultProjectId,
        CancellationToken ct) =>
        _inner.InsertWorkspaceAsync(workspaceId, tenantId, name, defaultProjectId, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct) =>
        _inner.ListWorkspacesAsync(tenantId, ct);

    /// <inheritdoc />
    public async Task SuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        await _inner.SuspendTenantAsync(tenantId, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task<bool> TryUnsuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        bool cleared = await _inner.TryUnsuspendTenantAsync(tenantId, ct);

        if (cleared)
            await InvalidateAsync(tenantId, ct);

        return cleared;
    }

    /// <inheritdoc />
    public Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct) =>
        _inner.GetFirstWorkspaceAsync(tenantId, ct);

    private Task InvalidateAsync(Guid tenantId, CancellationToken ct) =>
        HotPathCacheEviction.RemoveTenantAsync(_hotPathReadCache, tenantId, ct);
}
