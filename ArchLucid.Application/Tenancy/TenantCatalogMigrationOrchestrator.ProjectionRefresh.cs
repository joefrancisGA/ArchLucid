using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed partial class TenantCatalogMigrationOrchestrator
{
    public async Task<(TenantCatalogMigrationCommandOutcome Outcome, TenantMigrationProjectionRefreshResult? Refresh)> RunProjectionRefreshAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserName);

        TenantCatalogMigrationRecord? active =
            await _migrationRepository.GetActiveByTenantIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (active is null)
            return (TenantCatalogMigrationCommandOutcome.NoActiveMigration, null);

        if (active.Stage != TenantCatalogMigrationStage.CatalogAttachDetach)
            return (TenantCatalogMigrationCommandOutcome.WrongStage, null);

        TenantMigrationProjectionRefreshResult refresh = await _projectionRefreshService
            .RefreshAsync(tenantId, workspaceId, projectId, cancellationToken)
            .ConfigureAwait(false);

        await _migrationRepository
            .UpdateStageAsync(active.MigrationId, TenantCatalogMigrationStage.ProjectionRefresh, cancellationToken)
            .ConfigureAwait(false);

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantCatalogMigrationProjectionRefreshCompleted,
            tenantId,
            actorUserId,
            actorUserName,
            active.CorrelationId,
            new
            {
                migrationId = active.MigrationId,
                refresh.RetrievalIndexingRowsProcessed,
                refresh.RoiCacheKeysInvalidated,
                refresh.TenantScopeCachesInvalidated,
            },
            cancellationToken).ConfigureAwait(false);

        return (TenantCatalogMigrationCommandOutcome.Applied, refresh);
    }
}
