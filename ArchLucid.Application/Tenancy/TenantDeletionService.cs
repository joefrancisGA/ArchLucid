using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantDeletionService(
    ITenantHardPurgeService tenantHardPurgeService,
    ITenantBlobPrefixDeletionService tenantBlobPrefixDeletionService,
    IPlatformAuditRepository platformAuditRepository,
    IOptionsMonitor<TrialLifecycleSchedulerOptions> trialLifecycleOptions,
    ITenantRepository tenantRepository,
    TimeProvider? timeProvider = null)
    : ITenantDeletionService
{
    private readonly ITenantHardPurgeService _tenantHardPurgeService =
        tenantHardPurgeService ?? throw new ArgumentNullException(nameof(tenantHardPurgeService));

    private readonly ITenantBlobPrefixDeletionService _tenantBlobPrefixDeletionService =
        tenantBlobPrefixDeletionService ?? throw new ArgumentNullException(nameof(tenantBlobPrefixDeletionService));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly IOptionsMonitor<TrialLifecycleSchedulerOptions> _trialLifecycleOptions =
        trialLifecycleOptions ?? throw new ArgumentNullException(nameof(trialLifecycleOptions));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<TenantDeletionResult> DeleteTenantAsync(
        Guid tenantId,
        TenantDeletionInvocation invocation,
        CancellationToken cancellationToken)
    {
        if (invocation is null) throw new ArgumentNullException(nameof(invocation));

        ArgumentException.ThrowIfNullOrWhiteSpace(invocation.ActorUserId);
        ArgumentException.ThrowIfNullOrWhiteSpace(invocation.ActorUserName);

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            throw new InvalidOperationException($"Tenant '{tenantId:D}' was not found.");

        if (tenant.TenantErasureApprovedUtc is null)
            throw new InvalidOperationException("Tenant erasure must be explicitly approved by an Admin before hard purge.");

        await RevalidateTenantForHardPurgeAsync(tenantId, cancellationToken);

        TrialLifecycleSchedulerOptions lifecycle = _trialLifecycleOptions.CurrentValue;
        int maxRows = lifecycle.HardPurgeMaxRowsPerStatement > 0 ? lifecycle.HardPurgeMaxRowsPerStatement : 5000;

        await RevalidateTenantForHardPurgeAsync(tenantId, cancellationToken);

        TenantBlobPrefixDeletionResult blobs =
            await _tenantBlobPrefixDeletionService.DeleteAllTenantPrefixesAsync(tenantId, cancellationToken);

        await RevalidateTenantForHardPurgeAsync(tenantId, cancellationToken);

        TenantHardPurgeResult purge = await _tenantHardPurgeService.PurgeTenantAsync(
                tenantId,
                new TenantHardPurgeOptions
                {
                    DryRun = false,
                    MaxRowsPerStatement = maxRows,
                    DeleteTenantScopedAuditEvents = true
                },
                cancellationToken)
            .ConfigureAwait(false);

        string dataJson = System.Text.Json.JsonSerializer.Serialize(
            new
            {
                sqlRowsDeleted = purge.RowsDeleted,
                sqlRowCountsByTable = purge.RowCountsByTable,
                blobsDeletedByContainer = blobs.BlobsDeletedByContainer
            });

        TenantRecord? tenantBeforeAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeAudit?.TenantErasureApprovedUtc is null)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        TenantRecord? tenantBeforeDeletionAudit = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeDeletionAudit?.TenantErasureApprovedUtc is null)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        if (tenantBeforeDeletionAudit.LegalHoldUntilUtc is { } legalHoldUntil && legalHoldUntil > utcNow)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        TenantRecord? tenantBeforeDeletionAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforeDeletionAuditAppend?.TenantErasureApprovedUtc is null)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        utcNow = _timeProvider.GetUtcNow();

        if (tenantBeforeDeletionAuditAppend.LegalHoldUntilUtc is { } holdUntilAppend && holdUntilAppend > utcNow)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        TenantRecord? tenantImmediatelyBeforeDeletionAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantImmediatelyBeforeDeletionAuditAppend?.TenantErasureApprovedUtc is null)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        utcNow = _timeProvider.GetUtcNow();

        if (tenantImmediatelyBeforeDeletionAuditAppend.LegalHoldUntilUtc is { } holdUntilImmediateAppend
            && holdUntilImmediateAppend > utcNow)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        TenantRecord? tenantBeforePlatformDeletionAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantBeforePlatformDeletionAuditAppend?.TenantErasureApprovedUtc is null)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        utcNow = _timeProvider.GetUtcNow();

        if (tenantBeforePlatformDeletionAuditAppend.LegalHoldUntilUtc is { } holdUntilPlatformAppend
            && holdUntilPlatformAppend > utcNow)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        TenantRecord? tenantImmediatelyBeforePlatformDeletionAuditAppend =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenantImmediatelyBeforePlatformDeletionAuditAppend?.TenantErasureApprovedUtc is null)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        utcNow = _timeProvider.GetUtcNow();

        if (tenantImmediatelyBeforePlatformDeletionAuditAppend.LegalHoldUntilUtc is { } holdUntilFinalAppend
            && holdUntilFinalAppend > utcNow)
        {
            return new TenantDeletionResult
            {
                TenantId = tenantId,
                SqlRowsDeleted = purge.RowsDeleted,
                SqlRowCountsByTable = purge.RowCountsByTable,
                BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
            };
        }

        await _platformAuditRepository
            .AppendAsync(
                new PlatformAuditEvent
                {
                    EventType = AuditEventTypes.TenantDataDeleted,
                    ActorUserId = invocation.ActorUserId.Trim(),
                    ActorUserName = invocation.ActorUserName.Trim(),
                    SubjectTenantId = tenantId,
                    DataJson = dataJson,
                    CorrelationId = string.IsNullOrWhiteSpace(invocation.CorrelationId)
                        ? null
                        : invocation.CorrelationId.Trim(),
                },
                cancellationToken)
            .ConfigureAwait(false);

        return new TenantDeletionResult
        {
            TenantId = tenantId,
            SqlRowsDeleted = purge.RowsDeleted,
            SqlRowCountsByTable = purge.RowCountsByTable,
            BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
        };
    }

    private async Task<TenantRecord> RevalidateTenantForHardPurgeAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            throw new InvalidOperationException($"Tenant '{tenantId:D}' was not found.");

        if (tenant.TenantErasureApprovedUtc is null)
            throw new InvalidOperationException("Tenant erasure must be explicitly approved by an Admin before hard purge.");

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        if (tenant.LegalHoldUntilUtc is { } legalHoldUntil && legalHoldUntil > utcNow)
        {
            throw new InvalidOperationException(
                "Tenant erasure hard purge is blocked while an active legal hold is in effect.");
        }

        return tenant;
    }
}
