using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref="ITenantMigrationProjectionRefreshService" />
public sealed class TenantMigrationProjectionRefreshService(
    ITenantMigrationRetrievalOutboxDrainer retrievalOutboxDrainer,
    IHotPathReadCache hotPathReadCache,
    IPolicyPackResolverCacheInvalidator policyPackResolverCacheInvalidator) : ITenantMigrationProjectionRefreshService
{
    private const int RetrievalBatchPasses = 3;
    private const string HotPathPrefix = "al:hot:";

    private readonly ITenantMigrationRetrievalOutboxDrainer _retrievalOutboxDrainer =
        retrievalOutboxDrainer ?? throw new ArgumentNullException(nameof(retrievalOutboxDrainer));

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IPolicyPackResolverCacheInvalidator _policyPackResolverCacheInvalidator =
        policyPackResolverCacheInvalidator
        ?? throw new ArgumentNullException(nameof(policyPackResolverCacheInvalidator));

    public async Task<TenantMigrationProjectionRefreshResult> RefreshAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        int rowsProcessed = 0;

        for (int pass = 0; pass < RetrievalBatchPasses; pass++)
        {
            rowsProcessed += await _retrievalOutboxDrainer
                .ProcessPendingBatchAsync(cancellationToken)
                .ConfigureAwait(false);
        }

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        string roiCacheKey = $"sponsor-roi:summary:{tenantId:N}:{workspaceId:N}:{projectId:N}";
        await _hotPathReadCache.RemoveAsync(roiCacheKey, cancellationToken).ConfigureAwait(false);
        await _hotPathReadCache
            .RemoveAsync($"{HotPathPrefix}tenant:{tenantId:N}", cancellationToken)
            .ConfigureAwait(false);
        await _hotPathReadCache
            .RemoveAsync(
                $"{HotPathPrefix}runlist-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}",
                cancellationToken)
            .ConfigureAwait(false);
        await _hotPathReadCache
            .RemoveAsync(
                $"{HotPathPrefix}auditlist-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}",
                cancellationToken)
            .ConfigureAwait(false);
        await _hotPathReadCache
            .RemoveAsync(
                $"{HotPathPrefix}pplist-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}",
                cancellationToken)
            .ConfigureAwait(false);
        await _hotPathReadCache
            .RemoveAsync($"{HotPathPrefix}tidp:{tenantId:N}", cancellationToken)
            .ConfigureAwait(false);
        await _hotPathReadCache
            .RemoveAsync($"{HotPathPrefix}cr-rev:{tenantId:N}", cancellationToken)
            .ConfigureAwait(false);
        await _policyPackResolverCacheInvalidator
            .InvalidateTenantAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        return new TenantMigrationProjectionRefreshResult
        {
            RetrievalIndexingRowsProcessed = rowsProcessed,
            RoiCacheKeysInvalidated = 1,
            TenantScopeCachesInvalidated = 7,
        };
    }
}
