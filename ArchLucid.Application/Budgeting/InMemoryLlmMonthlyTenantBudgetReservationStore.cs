using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

/// <summary>
///     Process-local durable monthly per-call reservation store for tests and in-memory storage mode (TB-976).
/// </summary>
public sealed class InMemoryLlmMonthlyTenantBudgetReservationStore(
    ILlmTenantBudgetRepository budgetRepository,
    TimeProvider timeProvider)
    : ILlmMonthlyTenantBudgetReservationStore
{
    private readonly object _sync = new();

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly Dictionary<Guid, ReservationRow> _reservations = new();

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantBudgetReservationStoreResult> TryReserveAsync(
        LlmMonthlyTenantBudgetReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);

        if (request.ReserveUsd <= 0m)
        {
            LlmTenantBudgetStateReadModel state = await _budgetRepository
                .GetOrCreateAsync(request.TenantId, LlmBudgetPeriod.Monthly, request.PeriodKey, cancellationToken)
                .ConfigureAwait(false);

            return LlmMonthlyTenantBudgetReservationStoreResult.Permit(request.ReservationId, state);
        }

        await ReclaimExpiredLockedAsync(request.UtcNow, cancellationToken).ConfigureAwait(false);

        LlmTenantBudgetReserveResult reserved = await _budgetRepository
            .ReserveAsync(
                new LlmTenantBudgetReserveRequest
                {
                    TenantId = request.TenantId,
                    Period = LlmBudgetPeriod.Monthly,
                    PeriodKey = request.PeriodKey,
                    ReserveUsd = request.ReserveUsd,
                    HardCapUsd = request.HardCapUsd,
                    ExpectedRowVersion = request.ExpectedRowVersion
                },
                cancellationToken)
            .ConfigureAwait(false);

        if (reserved.ConcurrencyConflict)
            return LlmMonthlyTenantBudgetReservationStoreResult.RejectConcurrency();

        if (reserved.HardCapBlocked)
            return LlmMonthlyTenantBudgetReservationStoreResult.RejectHardCap(reserved.NewState);

        if (reserved.NewState is null)
            return LlmMonthlyTenantBudgetReservationStoreResult.RejectConcurrency();

        lock (_sync)
        {
            _reservations[request.ReservationId] = new ReservationRow
            {
                ReservationId = request.ReservationId,
                TenantId = request.TenantId,
                PeriodKey = reserved.AuthoritativePeriodKey ?? request.PeriodKey,
                ReservedUsd = request.ReserveUsd,
                ExpiresUtc = request.UtcNow + request.ReservationTtl,
                Status = ReservationRowStatus.Reserved
            };
        }

        return LlmMonthlyTenantBudgetReservationStoreResult.Permit(
            request.ReservationId,
            reserved.NewState,
            reserved.PeriodKeyMismatch,
            reserved.AuthoritativePeriodKey);
    }

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantBudgetReservationSettleResult> SettleAsync(
        Guid reservationId,
        decimal actualUsd,
        decimal warnAtUsd,
        CancellationToken cancellationToken = default)
    {
        if (reservationId == Guid.Empty)
            return LlmMonthlyTenantBudgetReservationSettleResult.NoOp();

        ReservationRow? row = GetPendingReservation(reservationId);

        if (row is null)
            return LlmMonthlyTenantBudgetReservationSettleResult.NoOp();

        LlmTenantBudgetStateReadModel state = await _budgetRepository
            .GetOrCreateAsync(row.TenantId, LlmBudgetPeriod.Monthly, row.PeriodKey, cancellationToken)
            .ConfigureAwait(false);

        LlmTenantBudgetSettleResult settled = await _budgetRepository
            .SettleAsync(
                new LlmTenantBudgetSettleRequest
                {
                    TenantId = row.TenantId,
                    Period = LlmBudgetPeriod.Monthly,
                    PeriodKey = row.PeriodKey,
                    ActualUsd = actualUsd,
                    ReleaseReservedUsd = row.ReservedUsd,
                    WarnAtUsd = warnAtUsd,
                    ExpectedRowVersion = state.RowVersion
                },
                cancellationToken)
            .ConfigureAwait(false);

        if (settled.ConcurrencyConflict || settled.NewState is null)
            return LlmMonthlyTenantBudgetReservationSettleResult.Conflict();

        lock (_sync)
        {
            if (_reservations.TryGetValue(reservationId, out ReservationRow? current)
                && current.Status == ReservationRowStatus.Reserved)
            {
                current.Status = ReservationRowStatus.Settled;
                current.CommittedUsd = actualUsd;
            }
        }

        return LlmMonthlyTenantBudgetReservationSettleResult.Completed(
            settled.NewState,
            settled.ShouldEmitWarnAudit,
            settled.PeriodKeyMismatch,
            settled.AuthoritativePeriodKey);
    }

    /// <inheritdoc />
    public async Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        if (reservationId == Guid.Empty)
            return;

        ReservationRow? row = GetPendingReservation(reservationId);

        if (row is null)
            return;

        LlmTenantBudgetStateReadModel state = await _budgetRepository
            .GetOrCreateAsync(row.TenantId, LlmBudgetPeriod.Monthly, row.PeriodKey, cancellationToken)
            .ConfigureAwait(false);

        await _budgetRepository
            .SettleAsync(
                new LlmTenantBudgetSettleRequest
                {
                    TenantId = row.TenantId,
                    Period = LlmBudgetPeriod.Monthly,
                    PeriodKey = row.PeriodKey,
                    ActualUsd = 0m,
                    ReleaseReservedUsd = row.ReservedUsd,
                    WarnAtUsd = 0m,
                    ExpectedRowVersion = state.RowVersion
                },
                cancellationToken)
            .ConfigureAwait(false);

        lock (_sync)
        {
            if (_reservations.TryGetValue(reservationId, out ReservationRow? current)
                && current.Status == ReservationRowStatus.Reserved)
            {
                current.Status = ReservationRowStatus.Released;
            }
        }
    }

    /// <inheritdoc />
    public Task<LlmMonthlyTenantBudgetReclaimResult> ReclaimExpiredBatchAsync(
        CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            int reclaimed = ReclaimExpiredLocked(_timeProvider.GetUtcNow());

            return Task.FromResult(new LlmMonthlyTenantBudgetReclaimResult { ReclaimedCount = reclaimed });
        }
    }

    /// <inheritdoc />
    public async Task<bool> ReconcileUnsettledAsync(
        Guid reservationId,
        decimal actualUsd,
        decimal warnAtUsd,
        CancellationToken cancellationToken = default)
    {
        LlmMonthlyTenantBudgetReservationSettleResult result =
            await SettleAsync(reservationId, actualUsd, warnAtUsd, cancellationToken).ConfigureAwait(false);

        return result.Succeeded;
    }

    private ReservationRow? GetPendingReservation(Guid reservationId)
    {
        lock (_sync)
        {
            if (!_reservations.TryGetValue(reservationId, out ReservationRow? row)
                || row.Status != ReservationRowStatus.Reserved)
            {
                return null;
            }

            return row;
        }
    }

    private async Task ReclaimExpiredLockedAsync(DateTimeOffset utcNow, CancellationToken cancellationToken)
    {
        List<ReservationRow> expired;

        lock (_sync)
        {
            expired = _reservations.Values
                .Where(r => r.Status == ReservationRowStatus.Reserved && r.ExpiresUtc <= utcNow)
                .ToList();
        }

        foreach (ReservationRow row in expired)
        {
            await ReleaseAsync(row.ReservationId, cancellationToken).ConfigureAwait(false);

            lock (_sync)
            {
                if (_reservations.TryGetValue(row.ReservationId, out ReservationRow? current)
                    && current.Status == ReservationRowStatus.Released)
                {
                    current.Status = ReservationRowStatus.Expired;
                }
            }
        }
    }

    private int ReclaimExpiredLocked(DateTimeOffset utcNow)
    {
        List<ReservationRow> expired = _reservations.Values
            .Where(r => r.Status == ReservationRowStatus.Reserved && r.ExpiresUtc <= utcNow)
            .ToList();

        int reclaimed = 0;

        foreach (ReservationRow row in expired)
        {
            LlmTenantBudgetStateReadModel state = _budgetRepository
                .GetOrCreateAsync(row.TenantId, LlmBudgetPeriod.Monthly, row.PeriodKey, CancellationToken.None)
                .GetAwaiter()
                .GetResult();

            _budgetRepository
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = row.TenantId,
                        Period = LlmBudgetPeriod.Monthly,
                        PeriodKey = row.PeriodKey,
                        ActualUsd = 0m,
                        ReleaseReservedUsd = row.ReservedUsd,
                        WarnAtUsd = 0m,
                        ExpectedRowVersion = state.RowVersion
                    },
                    CancellationToken.None)
                .GetAwaiter()
                .GetResult();

            row.Status = ReservationRowStatus.Expired;
            reclaimed++;
        }

        return reclaimed;
    }

    private enum ReservationRowStatus
    {
        Reserved,
        Settled,
        Released,
        Expired
    }

    private sealed class ReservationRow
    {
        public required Guid ReservationId { get; init; }

        public required Guid TenantId { get; init; }

        public required string PeriodKey { get; init; }

        public required decimal ReservedUsd { get; init; }

        public decimal CommittedUsd { get; set; }

        public required DateTimeOffset ExpiresUtc { get; init; }

        public ReservationRowStatus Status { get; set; }
    }
}
