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

        TenantRecord? tenantBeforeProbe =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeProbe?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, null);

        if (isFirstVerificationAttempt)
        {
            await _migrationRepository
                .UpdateStageAsync(active.MigrationId, TenantCatalogMigrationStage.Verification, cancellationToken)
                .ConfigureAwait(false);
        }

        TenantRecord? tenantBeforeProbeRun =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeProbeRun?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, null);

        TenantMigrationVerificationProbeResult probe = await _verificationProbe
            .RunAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        TenantRecord? tenantBeforeMark =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeMark?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, probe);

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        string? normalizedError = NormalizeVerificationErrorMessage(probe.ErrorMessage);

        await _migrationRepository
            .MarkVerificationResultAsync(active.MigrationId, probe.Passed, normalizedError, utcNow, cancellationToken)
            .ConfigureAwait(false);

        TenantRecord? tenantAfterProbe =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantAfterProbe?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, probe);

        TenantRecord? tenantBeforeVerificationAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeVerificationAudit?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, probe);

        TenantRecord? tenantBeforeVerificationAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeVerificationAuditAppend?.OffboardedUtc is not null)
            return (TenantCatalogMigrationCommandOutcome.InErasureQuarantine, probe);

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

    private static string? NormalizeVerificationErrorMessage(string? errorMessage) =>
        string.IsNullOrWhiteSpace(errorMessage) ? null : errorMessage.Trim();

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

        TenantRecord? tenantBeforeComplete =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeComplete?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeRepositoryComplete =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeRepositoryComplete?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        DateTimeOffset completedUtc = _timeProvider.GetUtcNow();

        await _migrationRepository.CompleteAsync(active.MigrationId, completedUtc, cancellationToken).ConfigureAwait(false);

        TenantRecord? tenantAfterRepositoryComplete =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantAfterRepositoryComplete?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        if (tenantAfterRepositoryComplete is not null
            && tenantAfterRepositoryComplete.SuspendedUtc is { } suspendedUtc
            && suspendedUtc >= active.StartedUtc)
        {
            TenantRecord? tenantBeforeUnsuspend =
                await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

            if (tenantBeforeUnsuspend?.OffboardedUtc is not null)
                return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

            await _tenantSuspendCommandService
                .TryUnsuspendAsync(tenantId, actorUserId, actorUserName, active.CorrelationId, cancellationToken)
                .ConfigureAwait(false);
        }

        TenantRecord? tenantBeforeAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeAudit?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeCompletedAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeCompletedAudit?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeCompletedAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeCompletedAuditAppend?.OffboardedUtc is not null)
            return TenantCatalogMigrationCommandOutcome.InErasureQuarantine;

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
