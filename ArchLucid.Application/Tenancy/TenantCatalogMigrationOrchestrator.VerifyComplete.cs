using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed partial class TenantCatalogMigrationOrchestrator
{
    public async Task<(TenantCatalogMigrationCommandOutcome Outcome, TenantMigrationVerificationProbeResult? Probe)> RunVerificationAsync(
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
            return (TenantCatalogMigrationCommandOutcome.NoActiveMigration, null);

        bool isFirstVerificationAttempt = active.Stage == TenantCatalogMigrationStage.ProjectionRefresh;
        bool isVerificationRetry = active.Stage == TenantCatalogMigrationStage.Verification
            && active.VerificationPassedUtc is null;

        if (!isFirstVerificationAttempt && !isVerificationRetry)
            return (TenantCatalogMigrationCommandOutcome.WrongStage, null);

        if (isFirstVerificationAttempt)
        {
            await _migrationRepository
                .UpdateStageAsync(active.MigrationId, TenantCatalogMigrationStage.Verification, cancellationToken)
                .ConfigureAwait(false);
        }

        TenantMigrationVerificationProbeResult probe = await _verificationProbe
            .RunAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        await _migrationRepository
            .MarkVerificationResultAsync(active.MigrationId, probe.Passed, probe.ErrorMessage, utcNow, cancellationToken)
            .ConfigureAwait(false);

        string auditType = probe.Passed
            ? AuditEventTypes.TenantCatalogMigrationVerificationPassed
            : AuditEventTypes.TenantCatalogMigrationVerificationFailed;

        await AppendPlatformAuditAsync(
            auditType,
            tenantId,
            actorUserId,
            actorUserName,
            active.CorrelationId,
            new { migrationId = active.MigrationId, probe.ProbeRunId, probe.ErrorMessage, probe.WriteFreezeVerified, probe.AuthorizationBoundaryVerified },
            cancellationToken).ConfigureAwait(false);

        if (!probe.Passed)
            return (TenantCatalogMigrationCommandOutcome.VerificationFailed, probe);

        return (TenantCatalogMigrationCommandOutcome.Applied, probe);
    }

    public async Task<TenantCatalogMigrationCommandOutcome> CompleteAsync(
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

        if (active.Stage != TenantCatalogMigrationStage.Verification)
            return TenantCatalogMigrationCommandOutcome.WrongStage;

        if (active.VerificationPassedUtc is null)
            return TenantCatalogMigrationCommandOutcome.VerificationRequired;

        DateTimeOffset completedUtc = _timeProvider.GetUtcNow();

        await _migrationRepository.CompleteAsync(active.MigrationId, completedUtc, cancellationToken).ConfigureAwait(false);

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant?.SuspendedUtc is { } suspendedUtc && suspendedUtc >= active.StartedUtc)
        {
            await _tenantSuspendCommandService
                .TryUnsuspendAsync(tenantId, actorUserId, actorUserName, active.CorrelationId, cancellationToken)
                .ConfigureAwait(false);
        }

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantCatalogMigrationCompleted,
            tenantId,
            actorUserId,
            actorUserName,
            active.CorrelationId,
            new { migrationId = active.MigrationId, completedUtc },
            cancellationToken).ConfigureAwait(false);

        return TenantCatalogMigrationCommandOutcome.Applied;
    }
}
