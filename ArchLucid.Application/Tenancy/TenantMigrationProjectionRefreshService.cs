using ArchLucid.Persistence.Caching;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref="ITenantMigrationProjectionRefreshService" />
public sealed class TenantMigrationProjectionRefreshService(
    ITenantMigrationRetrievalOutboxDrainer retrievalOutboxDrainer,
    IHotPathReadCache hotPathReadCache) : ITenantMigrationProjectionRefreshService
{
    private const int RetrievalBatchPasses = 3;

    private readonly ITenantMigrationRetrievalOutboxDrainer _retrievalOutboxDrainer =
        retrievalOutboxDrainer ?? throw new ArgumentNullException(nameof(retrievalOutboxDrainer));

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

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

        string roiCacheKey = $"executive-roi:summary:{tenantId:N}:{workspaceId:N}:{projectId:N}";
        await _hotPathReadCache.RemoveAsync(roiCacheKey, cancellationToken).ConfigureAwait(false);

        return new TenantMigrationProjectionRefreshResult
        {
            RetrievalIndexingRowsProcessed = rowsProcessed,
            RoiCacheKeysInvalidated = 1,
        };
    }
}
