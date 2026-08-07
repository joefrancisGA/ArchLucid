using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantCatalogMigrationOrchestrator(
    ITenantCatalogMigrationRepository migrationRepository,
    ITenantRepository tenantRepository,
    ITenantSuspendCommandService tenantSuspendCommandService,
    ITenantMigrationProjectionRefreshService projectionRefreshService,
    ITenantMigrationVerificationProbe verificationProbe,
    IPlatformAuditRepository platformAuditRepository,
    TimeProvider timeProvider) : ITenantCatalogMigrationOrchestrator
{
    private const string DefaultMaintenanceMessage = TenantMigrationMaintenanceMessages.DefaultSuspendMessage;

    private readonly ITenantCatalogMigrationRepository _migrationRepository =
        migrationRepository ?? throw new ArgumentNullException(nameof(migrationRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantSuspendCommandService _tenantSuspendCommandService =
        tenantSuspendCommandService ?? throw new ArgumentNullException(nameof(tenantSuspendCommandService));

    private readonly ITenantMigrationProjectionRefreshService _projectionRefreshService =
        projectionRefreshService ?? throw new ArgumentNullException(nameof(projectionRefreshService));

    private readonly ITenantMigrationVerificationProbe _verificationProbe =
        verificationProbe ?? throw new ArgumentNullException(nameof(verificationProbe));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

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

        Guid migrationId = Guid.NewGuid();
        DateTimeOffset startedUtc = _timeProvider.GetUtcNow();

        TenantCatalogMigrationRecord record = new()
        {
            MigrationId = migrationId,
            TenantId = tenantId,
            CorrelationId = correlationId.Trim(),
            Stage = TenantCatalogMigrationStage.ScopeFreeze,
            StartedUtc = startedUtc,
            MaintenanceMessage = DefaultMaintenanceMessage,
        };

        await _migrationRepository.InsertAsync(record, cancellationToken).ConfigureAwait(false);

        await _tenantSuspendCommandService
            .TrySuspendAsync(tenantId, actorUserId, actorUserName, correlationId, cancellationToken)
            .ConfigureAwait(false);

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

        await _migrationRepository
            .UpdateStageAsync(active.MigrationId, TenantCatalogMigrationStage.ProjectionRefresh, cancellationToken)
            .ConfigureAwait(false);

        TenantMigrationProjectionRefreshResult refresh = await _projectionRefreshService
            .RefreshAsync(tenantId, workspaceId, projectId, cancellationToken)
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

        await _tenantSuspendCommandService
            .TryUnsuspendAsync(tenantId, actorUserId, actorUserName, active.CorrelationId, cancellationToken)
            .ConfigureAwait(false);

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

    private Task AppendPlatformAuditAsync(
        string eventType,
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        object payload,
        CancellationToken cancellationToken)
    {
        PlatformAuditEvent auditEvent = new()
        {
            EventType = eventType,
            SubjectTenantId = tenantId,
            ActorUserId = actorUserId,
            ActorUserName = actorUserName,
            CorrelationId = correlationId,
            DataJson = JsonSerializer.Serialize(payload),
        };

        return _platformAuditRepository.AppendAsync(auditEvent, cancellationToken);
    }
}
