using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed partial class TenantCatalogMigrationOrchestrator
{
    public async Task<(TenantCatalogMigrationCommandOutcome Outcome, Guid? MigrationId)> StartAsync(
        Guid tenantId,
        string correlationId,
        string actorUserId,
        string actorUserName,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(correlationId);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserName);

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return (TenantCatalogMigrationCommandOutcome.NotFound, null);

        TenantCatalogMigrationRecord? active =
            await _migrationRepository.GetActiveByTenantIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (active is not null)
            return (TenantCatalogMigrationCommandOutcome.AlreadyActive, active.MigrationId);

        if (tenant.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, null);

        DateTimeOffset startedUtc = _timeProvider.GetUtcNow();

        TenantSuspendOutcome suspendOutcome = await _tenantSuspendCommandService
            .TrySuspendAsync(tenantId, actorUserId, actorUserName, correlationId, cancellationToken)
            .ConfigureAwait(false);

        TenantCatalogMigrationCommandOutcome? suspendBlocker = MapSuspendBlocker(suspendOutcome);

        if (suspendBlocker is not null)
            return (suspendBlocker.Value, null);

        bool appliedScopeFreezeSuspend = suspendOutcome == TenantSuspendOutcome.Applied;

        TenantRecord? tenantBeforeInsert =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeInsert is null)
            return (TenantCatalogMigrationCommandOutcome.NotFound, null);

        if (tenantBeforeInsert.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, null);

        Guid migrationId = Guid.NewGuid();

        TenantCatalogMigrationRecord record = new()
        {
            MigrationId = migrationId,
            TenantId = tenantId,
            CorrelationId = correlationId.Trim(),
            Stage = TenantCatalogMigrationStage.ScopeFreeze,
            StartedUtc = startedUtc,
            MaintenanceMessage = DefaultMaintenanceMessage,
        };

        try
        {
            await _migrationRepository.InsertAsync(record, cancellationToken).ConfigureAwait(false);
        }
        catch
        {
            if (appliedScopeFreezeSuspend)
            {
                TenantRecord? tenantBeforeCompensatingUnsuspend =
                    await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

                if (tenantBeforeCompensatingUnsuspend?.OffboardedUtc is null)
                {
                    await _tenantSuspendCommandService
                        .TryUnsuspendAsync(tenantId, actorUserId, actorUserName, correlationId, cancellationToken)
                        .ConfigureAwait(false);
                }
            }

            throw;
        }

        TenantRecord? tenantAfterInsert =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantAfterInsert?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, migrationId);

        TenantRecord? tenantBeforeStartedAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeStartedAuditAppend?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, migrationId);

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantCatalogMigrationStarted,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new { migrationId, stage = record.Stage.ToString() },
            cancellationToken).ConfigureAwait(false);

        return (TenantCatalogMigrationCommandOutcome.Applied, migrationId);
    }

    private static TenantCatalogMigrationCommandOutcome? MapSuspendBlocker(TenantSuspendOutcome suspendOutcome) =>
        suspendOutcome switch
        {
            TenantSuspendOutcome.Applied => null,
            TenantSuspendOutcome.AlreadyInDesiredState => null,
            TenantSuspendOutcome.InErasureQuarantine => TenantCatalogMigrationCommandOutcome.InErasureQuarantine,
            TenantSuspendOutcome.NotFound => TenantCatalogMigrationCommandOutcome.NotFound,
            TenantSuspendOutcome.Conflict => TenantCatalogMigrationCommandOutcome.WrongStage,
            _ => throw new InvalidOperationException($"Unhandled tenant suspend outcome: {suspendOutcome}"),
        };
}
