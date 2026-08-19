using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Operator snapshot and reconciliation for Quick Scan global budget (TB-899).</summary>
public interface IQuickScanBudgetMonitoringService
{
    Task<QuickScanBudgetMonitoringSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);

    Task<QuickScanBudgetReconciliationResult> ReconcileAsync(CancellationToken cancellationToken = default);
}

/// <summary>Aggregated operator view of Quick Scan budget + recent usage.</summary>
public sealed class QuickScanBudgetMonitoringSnapshot
{
    public required bool SafetyEnabled { get; init; }

    public required string OperationalMode { get; init; }

    public required decimal HourlyCeilingUsd { get; init; }

    public required decimal DailyCeilingUsd { get; init; }

    public required QuickScanGlobalBudgetBucketSnapshot Buckets { get; init; }

    public DateTimeOffset? LastReconciliationUtc { get; init; }

    public int LastReconciliationExpiredCount { get; init; }

    public required IReadOnlyList<QuickScanUsageRecord> RecentUsage { get; init; }
}

/// <inheritdoc cref="IQuickScanBudgetMonitoringService" />
public sealed class QuickScanBudgetMonitoringService(
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
    IQuickScanGlobalBudgetReservationStore budgetStore,
    IQuickScanUsageRecordStore usageRecordStore,
    IQuickScanSafetyOperationalStateProvider operationalStateProvider,
    ILogger<QuickScanBudgetMonitoringService> logger,
    TimeProvider timeProvider) : IQuickScanBudgetMonitoringService
{
    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    private readonly IQuickScanGlobalBudgetReservationStore _budgetStore =
        budgetStore ?? throw new ArgumentNullException(nameof(budgetStore));

    private readonly IQuickScanUsageRecordStore _usageRecordStore =
        usageRecordStore ?? throw new ArgumentNullException(nameof(usageRecordStore));

    private readonly IQuickScanSafetyOperationalStateProvider _operationalStateProvider =
        operationalStateProvider ?? throw new ArgumentNullException(nameof(operationalStateProvider));

    private readonly ILogger<QuickScanBudgetMonitoringService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private DateTimeOffset? _lastReconciliationUtc;

    private int _lastReconciliationExpiredCount;

    /// <inheritdoc />
    public async Task<QuickScanBudgetMonitoringSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default)
    {
        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;
        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        QuickScanSafetyOperationalSnapshot operational =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        QuickScanGlobalBudgetBucketSnapshot buckets =
            await _budgetStore.GetBucketSnapshotAsync(utcNow, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<QuickScanUsageRecord> recent =
            await _usageRecordStore.ListRecentAsync(25, cancellationToken).ConfigureAwait(false);

        EmitUtilizationAlerts(safety, buckets);

        return new QuickScanBudgetMonitoringSnapshot
        {
            SafetyEnabled = safety.Enabled,
            OperationalMode = operational.Mode.ToString(),
            HourlyCeilingUsd = safety.GlobalBudget.MaxAnonymousSpendPerHour,
            DailyCeilingUsd = safety.GlobalBudget.MaxAnonymousSpendPerDay,
            Buckets = buckets,
            LastReconciliationUtc = _lastReconciliationUtc,
            LastReconciliationExpiredCount = _lastReconciliationExpiredCount,
            RecentUsage = recent,
        };
    }

    /// <inheritdoc />
    public async Task<QuickScanBudgetReconciliationResult> ReconcileAsync(CancellationToken cancellationToken = default)
    {
        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        try
        {
            QuickScanBudgetReconciliationResult result =
                await _budgetStore.ReconcileExpiredReservationsAsync(utcNow, cancellationToken).ConfigureAwait(false);

            _lastReconciliationUtc = result.ReconciledUtc;
            _lastReconciliationExpiredCount = result.ExpiredReservationCount;

            if (result.ExpiredReservationCount > 0)
            {
                _logger.LogWarning(
                    "Quick Scan budget reconciliation released {ExpiredCount} expired pending reservations.",
                    result.ExpiredReservationCount);
            }
            else
            {
                _logger.LogInformation("Quick Scan budget reconciliation completed with no expired reservations.");
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quick Scan budget reconciliation failed.");

            throw;
        }
    }

    private void EmitUtilizationAlerts(QuickScanSafetyOptions safety, QuickScanGlobalBudgetBucketSnapshot buckets)
    {
        decimal hourCeiling = safety.GlobalBudget.MaxAnonymousSpendPerHour;
        decimal dayCeiling = safety.GlobalBudget.MaxAnonymousSpendPerDay;

        if (hourCeiling > 0m)
        {
            decimal hourUtil = (buckets.HourReservedUsd + buckets.HourCommittedUsd) / hourCeiling;

            if (hourUtil >= 0.95m)
            {
                _logger.LogError(
                    "Quick Scan hourly budget utilization high: {Utilization:P1} (reserved {Reserved} committed {Committed} ceiling {Ceiling}).",
                    hourUtil,
                    buckets.HourReservedUsd,
                    buckets.HourCommittedUsd,
                    hourCeiling);
            }
            else if (hourUtil >= 0.80m)
            {
                _logger.LogWarning(
                    "Quick Scan hourly budget utilization elevated: {Utilization:P1}.",
                    hourUtil);
            }
        }

        if (dayCeiling > 0m)
        {
            decimal dayUtil = (buckets.DayReservedUsd + buckets.DayCommittedUsd) / dayCeiling;

            if (dayUtil >= 0.95m)
            {
                _logger.LogError(
                    "Quick Scan daily budget utilization high: {Utilization:P1} (reserved {Reserved} committed {Committed} ceiling {Ceiling}).",
                    dayUtil,
                    buckets.DayReservedUsd,
                    buckets.DayCommittedUsd,
                    dayCeiling);
            }
            else if (dayUtil >= 0.80m)
            {
                _logger.LogWarning(
                    "Quick Scan daily budget utilization elevated: {Utilization:P1}.",
                    dayUtil);
            }
        }
    }
}
