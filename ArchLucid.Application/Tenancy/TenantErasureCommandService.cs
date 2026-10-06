using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantErasureCommandService(
    ITenantRepository tenantRepository,
    IPlatformAuditRepository platformAuditRepository,
    TimeProvider timeProvider,
    IOptionsMonitor<TenantErasurePurgeOptions> tenantErasureOptions) : ITenantErasureCommandService
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly IOptionsMonitor<TenantErasurePurgeOptions> _tenantErasureOptions =
        tenantErasureOptions ?? throw new ArgumentNullException(nameof(tenantErasureOptions));

    /// <inheritdoc />
    public async Task<TenantErasureOffboardResult?> TryOffboardTenantAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return null;

        if (tenant.OffboardedUtc is not null)
            return TryBuildExistingOffboardResult(tenant);

        DateTimeOffset now = _timeProvider.GetUtcNow();
        int days = Math.Clamp(_tenantErasureOptions.CurrentValue.QuarantineDays, 1, 3650);
        DateTimeOffset eligible = now.AddDays(days);

        bool started =
            await _tenantRepository.TryStartTenantErasureOffboardAsync(tenantId, now, eligible, cancellationToken);

        if (!started)
        {
            TenantRecord? afterMiss = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

            return TryBuildExistingOffboardResult(afterMiss);
        }

        await _tenantRepository.SuspendTenantAsync(tenantId, cancellationToken);

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantErasureOffboarded,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new
            {
                priorOffboardedUtc = (DateTimeOffset?)null,
                priorErasureEligibleUtc = (DateTimeOffset?)null,
                offboardedUtc = now,
                erasureEligibleUtc = eligible,
                quarantineDays = days
            },
            cancellationToken);

        return new TenantErasureOffboardResult(now, eligible);
    }

    /// <inheritdoc />
    public async Task<bool> TryRestoreQuarantineAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return false;

        if (tenant.OffboardedUtc is null)
            return true;

        DateTimeOffset? priorOffboarded = tenant.OffboardedUtc;
        DateTimeOffset? priorEligible = tenant.ErasureEligibleUtc;

        bool restored = await _tenantRepository.TryRestoreTenantErasureQuarantineAsync(tenantId, cancellationToken);

        if (!restored)
        {
            TenantRecord? afterMiss = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

            if (afterMiss is not null && afterMiss.OffboardedUtc is null)
                return true;

            return false;
        }

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantErasureQuarantineRestored,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new
            {
                priorOffboardedUtc = priorOffboarded,
                priorErasureEligibleUtc = priorEligible,
                offboardedUtc = (DateTimeOffset?)null,
                erasureEligibleUtc = (DateTimeOffset?)null
            },
            cancellationToken);

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> TrySetLegalHoldAsync(
        Guid tenantId,
        DateTimeOffset untilUtc,
        string? reason,
        string actorUserId,
        string actorUserName,
        bool requireErasureQuarantine,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return false;

        if (requireErasureQuarantine && tenant.OffboardedUtc is null)
            return false;

        string? normalizedReason = NormalizeLegalHoldReason(reason);

        if (IsIdenticalLegalHoldRetry(tenant, untilUtc, normalizedReason))
            return true;

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        DateTimeOffset? priorUntil = tenant.LegalHoldUntilUtc;
        string? priorReason = tenant.LegalHoldReason;

        bool ok = await _tenantRepository.TrySetTenantErasureLegalHoldAsync(
            tenantId,
            untilUtc,
            utcNow,
            normalizedReason,
            actorUserId,
            cancellationToken);

        if (!ok)
        {
            TenantRecord? afterMiss = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

            if (afterMiss is not null && IsIdenticalLegalHoldRetry(afterMiss, untilUtc, normalizedReason))
                return true;

            return false;
        }

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantErasureLegalHoldSet,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new
            {
                priorLegalHoldUntilUtc = priorUntil,
                priorLegalHoldReason = priorReason,
                legalHoldUntilUtc = untilUtc,
                legalHoldReason = normalizedReason
            },
            cancellationToken);

        return true;
    }

    private static string? NormalizeLegalHoldReason(string? reason)
    {
        if (reason is null)
            return null;

        string trimmed = reason.Trim();

        if (trimmed.Length == 0)
            return null;

        string[] tokens = trimmed.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

        return tokens.Length == 0 ? null : string.Join(' ', tokens);
    }

    /// <inheritdoc />
    public async Task<bool> TryApproveErasureAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null || tenant.OffboardedUtc is null)
            return false;

        if (tenant.TenantErasureApprovedUtc is not null)
            return true;

        DateTimeOffset now = _timeProvider.GetUtcNow();

        bool approved = await _tenantRepository.TryApproveTenantErasureAsync(tenantId, now, actorUserId, cancellationToken);

        if (!approved)
        {
            TenantRecord? afterMiss = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

            if (afterMiss?.TenantErasureApprovedUtc is not null)
                return true;

            return false;
        }

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantErasureApproved,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new { approvedUtc = now },
            cancellationToken);

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> TryClearLegalHoldAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return false;

        if (tenant.LegalHoldUntilUtc is null)
            return true;

        DateTimeOffset? priorUntil = tenant.LegalHoldUntilUtc;

        bool cleared = await _tenantRepository.TryClearTenantErasureLegalHoldAsync(tenantId, cancellationToken);

        if (!cleared)
        {
            TenantRecord? afterMiss = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

            if (afterMiss is not null && afterMiss.LegalHoldUntilUtc is null)
                return true;

            return false;
        }

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantErasureLegalHoldCleared,
            tenantId,
            actorUserId,
            actorUserName,
            correlationId,
            new { priorLegalHoldUntilUtc = priorUntil, legalHoldUntilUtc = (DateTimeOffset?)null },
            cancellationToken);

        return true;
    }

    private static TenantErasureOffboardResult? TryBuildExistingOffboardResult(TenantRecord? tenant)
    {
        if (tenant?.OffboardedUtc is null || tenant.ErasureEligibleUtc is null)
            return null;

        return new TenantErasureOffboardResult(tenant.OffboardedUtc.Value, tenant.ErasureEligibleUtc.Value);
    }

    private static bool IsIdenticalLegalHoldRetry(TenantRecord tenant, DateTimeOffset untilUtc, string? normalizedReason)
    {
        if (tenant.LegalHoldUntilUtc is null)
            return false;

        string? storedReason = NormalizeLegalHoldReason(tenant.LegalHoldReason);

        return tenant.LegalHoldUntilUtc.HasValue
            && tenant.LegalHoldUntilUtc.Value.UtcDateTime == untilUtc.UtcDateTime
            && string.Equals(storedReason, normalizedReason, StringComparison.OrdinalIgnoreCase);
    }

    private Task AppendPlatformAuditAsync(
        string eventType,
        Guid subjectTenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        object data,
        CancellationToken cancellationToken)
    {
        return _platformAuditRepository.AppendAsync(
            new PlatformAuditEvent
            {
                EventType = eventType,
                ActorUserId = actorUserId,
                ActorUserName = actorUserName,
                SubjectTenantId = subjectTenantId,
                DataJson = JsonSerializer.Serialize(data),
                CorrelationId = correlationId
            },
            cancellationToken);
    }
}
