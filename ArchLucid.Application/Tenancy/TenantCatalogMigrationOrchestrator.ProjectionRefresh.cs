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

        TenantRecord? tenantBeforeRefresh =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeRefresh?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, null);

        TenantRecord? tenantBeforeRefreshRun =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeRefreshRun?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, null);

        TenantMigrationProjectionRefreshResult refresh = await _projectionRefreshService
            .RefreshAsync(tenantId, workspaceId, projectId, cancellationToken)
            .ConfigureAwait(false);

        TenantRecord? tenantAfterRefresh =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantAfterRefresh?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, refresh);

        TenantRecord? tenantBeforeStageAdvance =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeStageAdvance?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, refresh);

        await _migrationRepository
            .UpdateStageAsync(active.MigrationId, TenantCatalogMigrationStage.ProjectionRefresh, cancellationToken)
            .ConfigureAwait(false);

        TenantRecord? tenantAfterStageUpdate =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantAfterStageUpdate?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, refresh);

        TenantRecord? tenantBeforeRefreshAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeRefreshAudit?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, refresh);

        TenantRecord? tenantBeforeRefreshAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeRefreshAuditAppend?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, refresh);

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
