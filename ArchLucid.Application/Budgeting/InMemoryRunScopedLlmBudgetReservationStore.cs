using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

/// <summary>
///     Process-wide in-memory pending reservation store for run agent batches (TB-939).
///     Production-like hosts should use a durable implementation — this is not shared across instances.
/// </summary>
public sealed class InMemoryRunScopedLlmBudgetReservationStore : IRunScopedLlmBudgetReservationStore
{
    private readonly object _sync = new();

    private readonly Dictionary<string, decimal> _pendingReservedUsd = new(StringComparer.Ordinal);

    private readonly Dictionary<Guid, ReservationRow> _reservations = new();

    private readonly Dictionary<string, Guid> _idempotencyIndex = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<RunScopedLlmBudgetReservationStoreResult> TryReserveAsync(
        RunScopedLlmBudgetReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ReserveUsd <= 0m)
        {
            return Task.FromResult(RunScopedLlmBudgetReservationStoreResult.Permit(request.ReservationId));
        }

        string periodBucketKey = BuildPeriodBucketKey(request.TenantId, request.PeriodKey);
        string idempotencyHash = HashIdempotencyKey(request.IdempotencyKey);
        decimal ceiling = RunAgentBatchBudgetEstimator.ApplyGrace(request.HardCapUsd, request.AccountingGracePercent);
        DateTimeOffset expiresUtc = request.UtcNow + request.ReservationTtl;

        lock (_sync)
        {
            ExpireReservations(request.UtcNow);

            if (_idempotencyIndex.TryGetValue(idempotencyHash, out Guid existingId)
                && _reservations.TryGetValue(existingId, out ReservationRow? existing)
                && existing.Status == ReservationRowStatus.Pending
                && existing.ExpiresUtc > request.UtcNow)
            {
                return Task.FromResult(RunScopedLlmBudgetReservationStoreResult.Permit(existingId));
            }

            decimal pendingSum = GetPending(_pendingReservedUsd, periodBucketKey);

            if (request.CurrentPressureUsd + pendingSum + request.ReserveUsd > ceiling)
            {
                return Task.FromResult(
                    RunScopedLlmBudgetReservationStoreResult.Reject(
                        RunScopedLlmBudgetReservationStoreRejectionReason.MonthlyCeilingExceeded));
            }

            _pendingReservedUsd[periodBucketKey] = pendingSum + request.ReserveUsd;

            ReservationRow row = new()
            {
                ReservationId = request.ReservationId,
                IdempotencyHash = idempotencyHash,
                PeriodBucketKey = periodBucketKey,
                ReservedUsd = request.ReserveUsd,
                ExpiresUtc = expiresUtc,
                Status = ReservationRowStatus.Pending,
            };

            _reservations[request.ReservationId] = row;
            _idempotencyIndex[idempotencyHash] = request.ReservationId;
        }

        return Task.FromResult(RunScopedLlmBudgetReservationStoreResult.Permit(request.ReservationId));
    }

    /// <inheritdoc />
    public Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default)
    {
        if (actualUsd < 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(actualUsd));
        }

        lock (_sync)
        {
            if (!_reservations.TryGetValue(reservationId, out ReservationRow? row)
                || row.Status != ReservationRowStatus.Pending)
            {
                return Task.CompletedTask;
            }

            ReleasePendingAmount(row.PeriodBucketKey, row.ReservedUsd);
            row.Status = ReservationRowStatus.Committed;
            row.CommittedUsd = actualUsd;
            _idempotencyIndex.Remove(row.IdempotencyHash);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            if (!_reservations.TryGetValue(reservationId, out ReservationRow? row)
                || row.Status != ReservationRowStatus.Pending)
            {
                return Task.CompletedTask;
            }

            ReleasePendingAmount(row.PeriodBucketKey, row.ReservedUsd);
            row.Status = ReservationRowStatus.Released;
            _idempotencyIndex.Remove(row.IdempotencyHash);
        }

        return Task.CompletedTask;
    }

    private void ExpireReservations(DateTimeOffset utcNow)
    {
        foreach (ReservationRow row in _reservations.Values)
        {
            if (row.Status != ReservationRowStatus.Pending || row.ExpiresUtc > utcNow)
            {
                continue;
            }

            ReleasePendingAmount(row.PeriodBucketKey, row.ReservedUsd);
            row.Status = ReservationRowStatus.Expired;
            _idempotencyIndex.Remove(row.IdempotencyHash);
        }
    }

    private void ReleasePendingAmount(string periodBucketKey, decimal amount)
    {
        if (amount <= 0m)
        {
            return;
        }

        decimal current = GetPending(_pendingReservedUsd, periodBucketKey);
        decimal next = Math.Max(0m, current - amount);

        if (next <= 0m)
        {
            _pendingReservedUsd.Remove(periodBucketKey);

            return;
        }

        _pendingReservedUsd[periodBucketKey] = next;
    }

    private static decimal GetPending(Dictionary<string, decimal> store, string key) =>
        store.TryGetValue(key, out decimal value) ? value : 0m;

    private static string BuildPeriodBucketKey(Guid tenantId, string periodKey) =>
        string.Concat(tenantId.ToString("N"), "|", periodKey);

    private static string HashIdempotencyKey(string idempotencyKey)
    {
        ArgumentNullException.ThrowIfNull(idempotencyKey);

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(idempotencyKey.Trim()));

        return Convert.ToHexString(hash);
    }

    private enum ReservationRowStatus
    {
        Pending,
        Committed,
        Released,
        Expired,
    }

    private sealed class ReservationRow
    {
        public required Guid ReservationId { get; init; }

        public required string IdempotencyHash { get; init; }

        public required string PeriodBucketKey { get; init; }

        public required decimal ReservedUsd { get; init; }

        public decimal CommittedUsd { get; set; }

        public required DateTimeOffset ExpiresUtc { get; init; }

        public ReservationRowStatus Status { get; set; }
    }
}
