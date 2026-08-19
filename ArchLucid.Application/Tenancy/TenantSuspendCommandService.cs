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

        await _tenantRepository.SuspendTenantAsync(tenantId, cancellationToken);

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
                ActorUserId = actorUserId,
                ActorUserName = actorUserName,
                SubjectTenantId = tenantId,
                DataJson = JsonSerializer.Serialize(data),
                CorrelationId = correlationId,
            },
            cancellationToken);
    }
}
