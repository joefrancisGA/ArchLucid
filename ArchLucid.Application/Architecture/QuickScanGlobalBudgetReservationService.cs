using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Coordinates Quick Scan global budget reservations against safety options (TB-894).</summary>
public interface IQuickScanGlobalBudgetReservationService
{
    Task<QuickScanGlobalBudgetReservationAttemptResult> TryReserveAsync(
        string idempotencyKey,
        decimal reserveUsd,
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default);

    Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default);

    Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IQuickScanGlobalBudgetReservationService" />
public sealed class QuickScanGlobalBudgetReservationService(
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
    IQuickScanGlobalBudgetReservationStore store,
    IQuickScanSafetyOperationalStateProvider operationalStateProvider,
    ILogger<QuickScanGlobalBudgetReservationService> logger) : IQuickScanGlobalBudgetReservationService
{
    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    private readonly IQuickScanGlobalBudgetReservationStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly IQuickScanSafetyOperationalStateProvider _operationalStateProvider =
        operationalStateProvider ?? throw new ArgumentNullException(nameof(operationalStateProvider));

    private readonly ILogger<QuickScanGlobalBudgetReservationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<QuickScanGlobalBudgetReservationAttemptResult> TryReserveAsync(
        string idempotencyKey,
        decimal reserveUsd,
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default)
    {
        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;
        QuickScanSafetyEffectiveFeatureState effective = safety.ResolveEffectiveFeatureState();

        if (!effective.Enabled)
        {
            return QuickScanGlobalBudgetReservationAttemptResult.Reject(
                QuickScanGlobalBudgetReservationRejectionReason.Disabled);
        }

        QuickScanSafetyOperationalSnapshot operational =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        if (!operational.AnonymousExecutionAllowed)
        {
            return QuickScanGlobalBudgetReservationAttemptResult.Reject(
                QuickScanGlobalBudgetReservationRejectionReason.EmergencyDisabled);
        }

        QuickScanSafetyGlobalBudgetLimits budget = safety.GlobalBudget;
        Guid reservationId = Guid.NewGuid();

        QuickScanGlobalBudgetReservationRequest request = new()
        {
            ReservationId = reservationId,
            IdempotencyKey = idempotencyKey,
            UtcNow = utcNow,
            ReserveUsd = reserveUsd,
            MaxHourUsd = budget.MaxAnonymousSpendPerHour,
            MaxDayUsd = budget.MaxAnonymousSpendPerDay,
            AccountingGracePercent = budget.BudgetAccountingGracePercent,
            ReservationTtl = TimeSpan.FromMinutes(Math.Max(1, budget.BudgetReservationTtlMinutes)),
        };

        try
        {
            QuickScanGlobalBudgetReservationStoreResult storeResult =
                await _store.TryReserveAsync(request, cancellationToken).ConfigureAwait(false);

            if (!storeResult.Allowed)
            {
                QuickScanGlobalBudgetReservationRejectionReason reason = storeResult.RejectionReason switch
                {
                    QuickScanGlobalBudgetReservationStoreRejectionReason.HourlyCeilingExceeded =>
                        QuickScanGlobalBudgetReservationRejectionReason.HourlyCeilingExceeded,
                    QuickScanGlobalBudgetReservationStoreRejectionReason.DailyCeilingExceeded =>
                        QuickScanGlobalBudgetReservationRejectionReason.DailyCeilingExceeded,
                    _ => QuickScanGlobalBudgetReservationRejectionReason.StoreUnavailable,
                };

                return QuickScanGlobalBudgetReservationAttemptResult.Reject(reason);
            }

            _logger.LogInformation(
                "Quick Scan global budget reserved {ReservationId} for {ReserveUsd} USD (hour/day UTC buckets).",
                storeResult.ReservationId,
                reserveUsd);

            return QuickScanGlobalBudgetReservationAttemptResult.Permit(storeResult.ReservationId!.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quick Scan global budget reservation store failed.");

            return QuickScanGlobalBudgetReservationAttemptResult.Reject(
                QuickScanGlobalBudgetReservationRejectionReason.StoreUnavailable);
        }
    }

    /// <inheritdoc />
    public Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default) =>
        _store.CommitAsync(reservationId, actualUsd, cancellationToken);

    /// <inheritdoc />
    public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default) =>
        _store.ReleaseAsync(reservationId, cancellationToken);
}
