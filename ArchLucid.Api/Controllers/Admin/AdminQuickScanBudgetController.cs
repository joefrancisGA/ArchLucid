using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Quick Scan global budget monitoring for operators (TB-899).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/quick-scan/budget")]
public sealed class AdminQuickScanBudgetController(IQuickScanBudgetMonitoringService monitoringService) : ControllerBase
{
    private readonly IQuickScanBudgetMonitoringService _monitoringService =
        monitoringService ?? throw new ArgumentNullException(nameof(monitoringService));

    [HttpGet]
    [ProducesResponseType(typeof(AdminQuickScanBudgetSnapshotResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminQuickScanBudgetSnapshotResponse>> GetAsync(CancellationToken cancellationToken)
    {
        QuickScanBudgetMonitoringSnapshot snapshot =
            await _monitoringService.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        return Ok(Map(snapshot));
    }

    private static AdminQuickScanBudgetSnapshotResponse Map(QuickScanBudgetMonitoringSnapshot snapshot) =>
        new()
        {
            SafetyEnabled = snapshot.SafetyEnabled,
            OperationalMode = snapshot.OperationalMode,
            HourlyCeilingUsd = snapshot.HourlyCeilingUsd,
            DailyCeilingUsd = snapshot.DailyCeilingUsd,
            HourBucketKey = snapshot.Buckets.HourBucketKey,
            DayBucketKey = snapshot.Buckets.DayBucketKey,
            HourReservedUsd = snapshot.Buckets.HourReservedUsd,
            HourCommittedUsd = snapshot.Buckets.HourCommittedUsd,
            DayReservedUsd = snapshot.Buckets.DayReservedUsd,
            DayCommittedUsd = snapshot.Buckets.DayCommittedUsd,
            PendingReservationCount = snapshot.Buckets.PendingReservationCount,
            ExpiredPendingReservationCount = snapshot.Buckets.ExpiredPendingReservationCount,
            LastReconciliationUtc = snapshot.LastReconciliationUtc,
            LastReconciliationExpiredCount = snapshot.LastReconciliationExpiredCount,
            RecentUsage = snapshot.RecentUsage
                .Select(
                    record => new AdminQuickScanUsageRecordRow
                    {
                        OccurredUtc = record.OccurredUtc,
                        Status = record.Status,
                        RouteKind = record.RouteKind,
                        ReservationId = record.ReservationId,
                        ReservedUsd = record.ReservedUsd,
                        ActualCostUsd = record.ActualCostUsd,
                        InputTokens = record.InputTokens,
                        OutputTokens = record.OutputTokens,
                        ModelLabel = record.ModelLabel,
                        RejectionReason = record.RejectionReason,
                        DurationMs = record.DurationMs,
                    })
                .ToList(),
        };
}
