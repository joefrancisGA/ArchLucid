using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

/// <summary>Applies one trial lifecycle step per invocation (Worker scheduler calls this per tenant).</summary>
public sealed class TrialLifecycleTransitionEngine(
    ITenantRepository tenantRepository,
    ITenantHardPurgeService tenantHardPurgeService,
    IAuditService auditService,
    IOptionsMonitor<TrialLifecycleSchedulerOptions> lifecycleOptions,
    TimeProvider timeProvider,
    ILogger<TrialLifecycleTransitionEngine> logger)
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptionsMonitor<TrialLifecycleSchedulerOptions> _lifecycleOptions =
        lifecycleOptions ?? throw new ArgumentNullException(nameof(lifecycleOptions));

    private readonly ILogger<TrialLifecycleTransitionEngine> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ITenantHardPurgeService
        _tenantHardPurgeService = tenantHardPurgeService ?? throw new ArgumentNullException(nameof(tenantHardPurgeService));

    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));
    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <summary>Attempts at most one forward transition for <paramref name = "tenantId"/>.</summary>
    public async Task<bool> TryAdvanceTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return false;

        if (tenant.OffboardedUtc is not null)
            return false;

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        if (tenant.LegalHoldUntilUtc is { } legalHoldUntil && legalHoldUntil > utcNow)
            return false;

        TrialLifecycleSchedulerOptions options = _lifecycleOptions.CurrentValue;

        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Deleted))
        {
            if (ShouldStopForAutomationGate(
                    await EvaluateAutomationGateAsync(tenantId, utcNow, cancellationToken),
                    out bool deletedGateReturn))
            {
                return deletedGateReturn;
            }

            if (await IsErasureSupersededAsync(tenantId, cancellationToken))
                return true;

            await _tenantHardPurgeService.PurgeTenantAsync(tenantId,
                new TenantHardPurgeOptions { DryRun = false, MaxRowsPerStatement = options.HardPurgeMaxRowsPerStatement }, cancellationToken);

            // Idempotent scheduler retries: a no-row purge pass still means the tick completed successfully.
            return true;
        }

        TrialLifecycleAdvancement? advancement = TrialLifecyclePolicy.TryGetNextAdvancement(tenant, _timeProvider.GetUtcNow(), options);

        if (advancement is null)
            return false;

        string persistedTrialStatus = tenant.TrialStatus!;

        if (string.Equals(advancement.ToStatus, TrialLifecycleStatus.Deleted, StringComparison.Ordinal))
        {
            if (ShouldStopForAutomationGate(
                    await EvaluateAutomationGateAsync(tenantId, utcNow, cancellationToken),
                    out bool purgeTransitionGateReturn))
            {
                return purgeTransitionGateReturn;
            }

            if (await IsErasureSupersededAsync(tenantId, cancellationToken))
                return true;

            bool recorded = await _tenantRepository.TryRecordTrialLifecycleTransitionAsync(
                tenantId,
                persistedTrialStatus,
                advancement.ToStatus,
                advancement.Reason,
                cancellationToken);

            if (!recorded)
            {
                if (await IsAdvancementAlreadyAppliedAsync(tenantId, advancement.ToStatus, cancellationToken))
                    return true;

                return false;
            }

            if (await TryEmitAuditAsync(tenant, advancement, cancellationToken)
                && !await IsErasureSupersededAsync(tenantId, cancellationToken))
            {
                ArchLucidInstrumentation.RecordTrialExpiration($"{advancement.FromStatus}->{advancement.ToStatus}");
            }

            if (ShouldStopForAutomationGate(
                    await EvaluateAutomationGateAsync(tenantId, utcNow, cancellationToken),
                    out bool purgeGateReturn))
            {
                return purgeGateReturn;
            }

            if (await IsErasureSupersededAsync(tenantId, cancellationToken))
                return true;

            TenantHardPurgeResult purgeResult = await _tenantHardPurgeService.PurgeTenantAsync(tenantId,
                new TenantHardPurgeOptions { DryRun = false, MaxRowsPerStatement = options.HardPurgeMaxRowsPerStatement }, cancellationToken);
            _logger.LogInformation("Trial hard purge completed for tenant {TenantId}: rowsDeleted={Rows}.", tenantId, purgeResult.RowsDeleted);
            return true;
        }

        if (ShouldStopForAutomationGate(
                await EvaluateAutomationGateAsync(tenantId, utcNow, cancellationToken),
                out bool transitionGateReturn))
        {
            return transitionGateReturn;
        }

        if (await IsErasureSupersededAsync(tenantId, cancellationToken))
            return true;

        bool ok = await _tenantRepository.TryRecordTrialLifecycleTransitionAsync(
            tenantId,
            persistedTrialStatus,
            advancement.ToStatus,
            advancement.Reason,
            cancellationToken);

        if (!ok)
        {
            if (await IsAdvancementAlreadyAppliedAsync(tenantId, advancement.ToStatus, cancellationToken))
                return true;

            return false;
        }

        if (await TryEmitAuditAsync(tenant, advancement, cancellationToken)
            && !await IsErasureSupersededAsync(tenantId, cancellationToken))
        {
            ArchLucidInstrumentation.RecordTrialExpiration($"{advancement.FromStatus}->{advancement.ToStatus}");
        }

        return true;
    }

    private async Task<bool> IsErasureSupersededAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return true;

        return tenant.OffboardedUtc is not null;
    }

    private async Task<TrialLifecycleAutomationGate> EvaluateAutomationGateAsync(
        Guid tenantId,
        DateTimeOffset utcNow,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return TrialLifecycleAutomationGate.Skip;

        if (tenant.OffboardedUtc is not null)
            return TrialLifecycleAutomationGate.SupersededByErasure;

        if (tenant.LegalHoldUntilUtc is { } legalHoldUntil && legalHoldUntil > utcNow)
            return TrialLifecycleAutomationGate.Skip;

        return TrialLifecycleAutomationGate.Proceed;
    }

    private static bool ShouldStopForAutomationGate(TrialLifecycleAutomationGate gate, out bool returnValue)
    {
        returnValue = false;

        if (gate == TrialLifecycleAutomationGate.Proceed)
            return false;

        returnValue = gate == TrialLifecycleAutomationGate.SupersededByErasure;

        return true;
    }

    private enum TrialLifecycleAutomationGate
    {
        Proceed,
        Skip,
        SupersededByErasure,
    }

    private async Task<bool> IsAdvancementAlreadyAppliedAsync(
        Guid tenantId,
        string targetStatus,
        CancellationToken cancellationToken)
    {
        TenantRecord? afterMiss = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (afterMiss is null)
            return false;

        if (afterMiss.OffboardedUtc is not null)
            return true;

        return TrialLifecycleStatus.EqualsStatus(afterMiss.TrialStatus, targetStatus);
    }

    private async Task<bool> TryEmitAuditAsync(
        TenantRecord tenant,
        TrialLifecycleAdvancement advancement,
        CancellationToken cancellationToken)
    {
        TenantRecord? current = await _tenantRepository.GetByIdAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

        if (current is null || current.OffboardedUtc is not null)
            return false;

        TenantWorkspaceLink? workspace = await _tenantRepository.GetFirstWorkspaceAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

        if (workspace is null)
            return false;

        TenantRecord? tenantBeforeAudit =
            await _tenantRepository.GetByIdAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeAudit is null || tenantBeforeAudit.OffboardedUtc is not null)
            return false;

        TenantRecord? tenantBeforeAuditAppend =
            await _tenantRepository.GetByIdAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

        if (tenantBeforeAuditAppend is null || tenantBeforeAuditAppend.OffboardedUtc is not null)
            return false;

        Guid workspaceId = workspace.WorkspaceId;
        Guid projectId = workspace.DefaultProjectId;
        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TrialLifecycleTransition,
                ActorUserId = "system:trial-lifecycle-scheduler",
                ActorUserName = "system:trial-lifecycle-scheduler",
                TenantId = tenantBeforeAudit.Id,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    fromStatus = advancement.FromStatus, toStatus = advancement.ToStatus, reason = advancement.Reason
                })
            }, cancellationToken);

        return true;
    }
}
