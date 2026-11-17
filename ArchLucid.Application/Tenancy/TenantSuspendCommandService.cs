using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantSuspendCommandService(
    ITenantRepository tenantRepository,
    IPlatformAuditRepository platformAuditRepository,
    TimeProvider timeProvider) : ITenantSuspendCommandService
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task<TenantSuspendOutcome> TrySuspendAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return TenantSuspendOutcome.NotFound;

        if (tenant.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        if (tenant.SuspendedUtc is not null)
            return TenantSuspendOutcome.AlreadyInDesiredState;

        bool suspended = await _tenantRepository.TrySuspendTenantAsync(tenantId, cancellationToken);

        if (!suspended)
            return await ResolveOutcomeAfterFailedLifecycleTransitionAsync(tenantId, unsuspendAttempt: false, cancellationToken);

        TenantRecord? afterSuspend = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterSuspend is null)
            return TenantSuspendOutcome.NotFound;

        if (afterSuspend.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeSuspendAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeSuspendAudit is null)
            return TenantSuspendOutcome.NotFound;

        if (tenantBeforeSuspendAudit.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeSuspendAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeSuspendAuditAppend is null)
            return TenantSuspendOutcome.NotFound;

        if (tenantBeforeSuspendAuditAppend.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantSuspended,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new { suspendedUtc = _timeProvider.GetUtcNow() },
            cancellationToken);

        return TenantSuspendOutcome.Applied;
    }

    /// <inheritdoc />
    public async Task<TenantSuspendOutcome> TryUnsuspendAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return TenantSuspendOutcome.NotFound;

        if (tenant.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        if (tenant.SuspendedUtc is null)
            return TenantSuspendOutcome.AlreadyInDesiredState;

        bool cleared = await _tenantRepository.TryUnsuspendTenantAsync(tenantId, cancellationToken);

        if (!cleared)
            return await ResolveOutcomeAfterFailedLifecycleTransitionAsync(tenantId, unsuspendAttempt: true, cancellationToken);

        TenantRecord? afterUnsuspend = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterUnsuspend is null)
            return TenantSuspendOutcome.NotFound;

        if (afterUnsuspend.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeUnsuspendAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeUnsuspendAudit is null)
            return TenantSuspendOutcome.NotFound;

        if (tenantBeforeUnsuspendAudit.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        TenantRecord? tenantBeforeUnsuspendAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeUnsuspendAuditAppend is null)
            return TenantSuspendOutcome.NotFound;

        if (tenantBeforeUnsuspendAuditAppend.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantUnsuspended,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new { unsuspendedUtc = _timeProvider.GetUtcNow() },
            cancellationToken);

        return TenantSuspendOutcome.Applied;
    }

    private async Task<TenantSuspendOutcome> ResolveOutcomeAfterFailedLifecycleTransitionAsync(
        Guid tenantId,
        bool unsuspendAttempt,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return TenantSuspendOutcome.NotFound;

        if (tenant.OffboardedUtc is not null)
            return TenantSuspendOutcome.InErasureQuarantine;

        if (unsuspendAttempt)
        {
            if (tenant.SuspendedUtc is null)
                return TenantSuspendOutcome.AlreadyInDesiredState;

            return TenantSuspendOutcome.Conflict;
        }

        if (tenant.SuspendedUtc is not null)
            return TenantSuspendOutcome.AlreadyInDesiredState;

        return TenantSuspendOutcome.Conflict;
    }

    private async Task AppendPlatformAuditAsync(
        string eventType,
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        object data,
        CancellationToken cancellationToken)
    {
        await _platformAuditRepository.AppendAsync(
            new PlatformAuditEvent
            {
                EventType = eventType,
                ActorUserId = actorUserId.Trim(),
                ActorUserName = actorUserName.Trim(),
                SubjectTenantId = tenantId,
                DataJson = JsonSerializer.Serialize(data),
                CorrelationId = string.IsNullOrWhiteSpace(correlationId) ? null : correlationId.Trim(),
            },
            cancellationToken);
    }
}
