using System.Security.Cryptography;
using System.Text;
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
        {
            return await CompleteOffboardSideEffectsAsync(
                tenant,
                actorUserId,
                actorUserName,
                correlationId,
                cancellationToken);
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();
        int days = Math.Clamp(_tenantErasureOptions.CurrentValue.QuarantineDays, 1, 3650);
        DateTimeOffset eligible = now.AddDays(days);

        bool started =
            await _tenantRepository.TryStartTenantErasureOffboardAsync(tenantId, now, eligible, cancellationToken);

        if (!started)
        {
            TenantRecord? afterMiss = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

            if (afterMiss is null)
                return null;

            return await CompleteOffboardSideEffectsAsync(
                afterMiss,
                actorUserId,
                actorUserName,
                correlationId,
                cancellationToken);
        }

        TenantRecord? beforeSuspend = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (beforeSuspend is null || beforeSuspend.OffboardedUtc is null)
            return null;

        await _tenantRepository.SuspendTenantAsync(tenantId, cancellationToken);

        TenantRecord? afterStart = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterStart is null)
            return null;

        if (afterStart.OffboardedUtc is null)
            return null;

        TenantRecord? beforeFirstOffboardAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (beforeFirstOffboardAudit is null
            || beforeFirstOffboardAudit.OffboardedUtc is null
            || beforeFirstOffboardAudit.ErasureEligibleUtc is null)
        {
            return null;
        }

        TenantRecord? immediatelyBeforeOffboardAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (immediatelyBeforeOffboardAudit is null
            || immediatelyBeforeOffboardAudit.OffboardedUtc is null
            || immediatelyBeforeOffboardAudit.ErasureEligibleUtc is null)
        {
            return null;
        }

        TenantRecord? tenantBeforeOffboardAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeOffboardAuditAppend is null
            || tenantBeforeOffboardAuditAppend.OffboardedUtc is null
            || tenantBeforeOffboardAuditAppend.ErasureEligibleUtc is null)
        {
            return null;
        }

        DateTimeOffset offboardedUtc = tenantBeforeOffboardAuditAppend.OffboardedUtc.Value;
        DateTimeOffset erasureEligibleUtc = tenantBeforeOffboardAuditAppend.ErasureEligibleUtc.Value;
        int quarantineDays = QuarantineDaysBetween(offboardedUtc, erasureEligibleUtc);

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
                offboardedUtc,
                erasureEligibleUtc,
                quarantineDays
            },
            cancellationToken,
            CreateOffboardAuditEventId(tenantBeforeOffboardAuditAppend.Id, offboardedUtc, erasureEligibleUtc));

        return new TenantErasureOffboardResult(offboardedUtc, erasureEligibleUtc);
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

        TenantRecord? afterRestore = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterRestore is null)
            return false;

        if (afterRestore.OffboardedUtc is not null)
            return true;

        TenantRecord? beforeRestoreAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (beforeRestoreAudit is null)
            return false;

        if (beforeRestoreAudit.OffboardedUtc is not null)
            return true;

        TenantRecord? tenantBeforeRestoreAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeRestoreAudit is null)
            return false;

        if (tenantBeforeRestoreAudit.OffboardedUtc is not null)
            return true;

        TenantRecord? tenantBeforeRestoreAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeRestoreAuditAppend is null)
            return false;

        if (tenantBeforeRestoreAuditAppend.OffboardedUtc is not null)
            return true;

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

            if (afterMiss is not null && afterMiss.OffboardedUtc is null && tenant.OffboardedUtc is not null)
                return true;

            return false;
        }

        TenantRecord? afterSet = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterSet is null)
            return false;

        if (afterSet.OffboardedUtc is null && tenant.OffboardedUtc is not null)
            return true;

        TenantRecord? beforeSetAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (beforeSetAudit is null)
            return false;

        if (beforeSetAudit.OffboardedUtc is null && tenant.OffboardedUtc is not null)
            return true;

        if (beforeSetAudit.LegalHoldUntilUtc is null && afterSet.LegalHoldUntilUtc is not null)
            return true;

        TenantRecord? tenantBeforeSetAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeSetAudit is null)
            return false;

        if (tenantBeforeSetAudit.OffboardedUtc is null && tenant.OffboardedUtc is not null)
            return true;

        if (tenantBeforeSetAudit.LegalHoldUntilUtc is null && afterSet.LegalHoldUntilUtc is not null)
            return true;

        TenantRecord? tenantBeforeSetAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeSetAuditAppend is null)
            return false;

        if (tenantBeforeSetAuditAppend.OffboardedUtc is null && tenant.OffboardedUtc is not null)
            return true;

        if (tenantBeforeSetAuditAppend.LegalHoldUntilUtc is null && afterSet.LegalHoldUntilUtc is not null)
            return true;

        TenantRecord? tenantImmediatelyBeforeSetHoldAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantImmediatelyBeforeSetHoldAuditAppend is null)
            return false;

        if (tenantImmediatelyBeforeSetHoldAuditAppend.OffboardedUtc is null && tenant.OffboardedUtc is not null)
            return true;

        if (tenantImmediatelyBeforeSetHoldAuditAppend.LegalHoldUntilUtc is null && afterSet.LegalHoldUntilUtc is not null)
            return true;

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

            if (afterMiss is not null && afterMiss.OffboardedUtc is null)
                return true;

            return false;
        }

        TenantRecord? afterApprove = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterApprove is null)
            return false;

        if (afterApprove.OffboardedUtc is null)
            return true;

        TenantRecord? beforeApproveAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (beforeApproveAudit is null)
            return false;

        if (beforeApproveAudit.OffboardedUtc is null)
            return true;

        TenantRecord? tenantBeforeApproveAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeApproveAudit is null)
            return false;

        if (tenantBeforeApproveAudit.OffboardedUtc is null)
            return true;

        TenantRecord? tenantBeforeApproveAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeApproveAuditAppend is null)
            return false;

        if (tenantBeforeApproveAuditAppend.OffboardedUtc is null)
            return true;

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

        TenantRecord? afterClear = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterClear is null)
            return false;

        if (afterClear.LegalHoldUntilUtc is not null)
            return true;

        TenantRecord? beforeClearAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (beforeClearAudit is null)
            return false;

        if (beforeClearAudit.LegalHoldUntilUtc is not null)
            return true;

        TenantRecord? tenantBeforeClearAudit =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeClearAudit is null)
            return false;

        if (tenantBeforeClearAudit.OffboardedUtc is not null)
            return true;

        if (tenantBeforeClearAudit.LegalHoldUntilUtc is not null)
            return true;

        TenantRecord? tenantBeforeClearAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeClearAuditAppend is null)
            return false;

        if (tenantBeforeClearAuditAppend.OffboardedUtc is not null)
            return true;

        if (tenantBeforeClearAuditAppend.LegalHoldUntilUtc is not null)
            return true;

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

    /// <summary>
    /// The offboard marker is written before suspend and audit. Retries re-attempt the
    /// idempotent audit append even when suspension has already landed.
    /// </summary>
    private async Task<TenantErasureOffboardResult?> CompleteOffboardSideEffectsAsync(
        TenantRecord tenant,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        TenantRecord? current = await _tenantRepository.GetByIdAsync(tenant.Id, cancellationToken);

        if (current is null || current.OffboardedUtc is null || current.ErasureEligibleUtc is null)
            return null;

        if (current.SuspendedUtc is null)
            await _tenantRepository.SuspendTenantAsync(current.Id, cancellationToken);

        TenantRecord? beforeOffboardAudit = await _tenantRepository.GetByIdAsync(current.Id, cancellationToken);

        if (beforeOffboardAudit is null
            || beforeOffboardAudit.OffboardedUtc is null
            || beforeOffboardAudit.ErasureEligibleUtc is null)
        {
            return null;
        }

        TenantRecord? tenantBeforeOffboardAuditAppend =
            await _tenantRepository.GetByIdAsync(current.Id, cancellationToken);

        if (tenantBeforeOffboardAuditAppend is null
            || tenantBeforeOffboardAuditAppend.OffboardedUtc is null
            || tenantBeforeOffboardAuditAppend.ErasureEligibleUtc is null)
        {
            return null;
        }

        int quarantineDays = QuarantineDaysBetween(
            tenantBeforeOffboardAuditAppend.OffboardedUtc.Value,
            tenantBeforeOffboardAuditAppend.ErasureEligibleUtc.Value);

        await AppendPlatformAuditAsync(
            AuditEventTypes.TenantErasureOffboarded,
            tenantBeforeOffboardAuditAppend.Id,
            actorUserId,
            actorUserName,
            correlationId,
            new
            {
                priorOffboardedUtc = (DateTimeOffset?)null,
                priorErasureEligibleUtc = (DateTimeOffset?)null,
                offboardedUtc = tenantBeforeOffboardAuditAppend.OffboardedUtc,
                erasureEligibleUtc = tenantBeforeOffboardAuditAppend.ErasureEligibleUtc,
                quarantineDays
            },
            cancellationToken,
            CreateOffboardAuditEventId(
                tenantBeforeOffboardAuditAppend.Id,
                tenantBeforeOffboardAuditAppend.OffboardedUtc.Value,
                tenantBeforeOffboardAuditAppend.ErasureEligibleUtc.Value));

        return new TenantErasureOffboardResult(
            tenantBeforeOffboardAuditAppend.OffboardedUtc.Value,
            tenantBeforeOffboardAuditAppend.ErasureEligibleUtc.Value);
    }

    private static int QuarantineDaysBetween(DateTimeOffset offboardedUtc, DateTimeOffset eligibleUtc)
    {
        double days = (eligibleUtc - offboardedUtc).TotalDays;

        if (days < 1)
            return 1;

        return (int)Math.Round(days, MidpointRounding.AwayFromZero);
    }

    private static Guid CreateOffboardAuditEventId(
        Guid tenantId,
        DateTimeOffset offboardedUtc,
        DateTimeOffset erasureEligibleUtc)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{AuditEventTypes.TenantErasureOffboarded}:{tenantId:N}:{offboardedUtc.UtcDateTime.Ticks}:{erasureEligibleUtc.UtcDateTime.Ticks}"));
        return new Guid(hash.AsSpan(0, 16));
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
        CancellationToken cancellationToken,
        Guid? eventId = null)
    {
        return _platformAuditRepository.AppendAsync(
            new PlatformAuditEvent
            {
                EventId = eventId ?? Guid.NewGuid(),
                EventType = eventType,
                ActorUserId = actorUserId.Trim(),
                ActorUserName = actorUserName.Trim(),
                SubjectTenantId = subjectTenantId,
                DataJson = JsonSerializer.Serialize(data),
                CorrelationId = string.IsNullOrWhiteSpace(correlationId) ? null : correlationId.Trim(),
            },
            cancellationToken);
    }
}
