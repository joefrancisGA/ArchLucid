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

        await _migrationRepository
            .UpdateStageAsync(active.MigrationId, TenantCatalogMigrationStage.CatalogAttachDetach, cancellationToken)
            .ConfigureAwait(false);

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
