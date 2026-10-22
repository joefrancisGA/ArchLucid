using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed partial class TenantCatalogMigrationOrchestrator
{
    public async Task<TenantCatalogMigrationCommandOutcome> AcknowledgeCatalogAttachDetachAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserName);

        TenantCatalogMigrationRecord? active =
            await _migrationRepository.GetActiveByTenantIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (active is null)
            return TenantCatalogMigrationCommandOutcome.NoActiveMigration;

        if (active.Stage != TenantCatalogMigrationStage.ScopeFreeze)
            return TenantCatalogMigrationCommandOutcome.WrongStage;

        TenantRecord? tenantBeforeStageUpdate =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeStageUpdate?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        await _migrationRepository
            .UpdateStageAsync(active.MigrationId, TenantCatalogMigrationStage.CatalogAttachDetach, cancellationToken)
            .ConfigureAwait(false);

        TenantRecord? tenantAfterStageUpdate =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantAfterStageUpdate?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeAttachAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeAttachAudit?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeAttachAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeAttachAuditAppend?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantCatalogMigrationCatalogAttachAcknowledged,
            tenantId,
            actorUserId,
            actorUserName,
            active.CorrelationId,
            new { migrationId = active.MigrationId, stage = TenantCatalogMigrationStage.CatalogAttachDetach.ToString() },
            cancellationToken).ConfigureAwait(false);

        return TenantCatalogMigrationCommandOutcome.Applied;
    }
}
