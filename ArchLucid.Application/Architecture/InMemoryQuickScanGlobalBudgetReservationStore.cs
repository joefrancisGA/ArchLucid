using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Process-wide in-memory global budget store for simulator/tests (TB-894).
///     Production-like hosts must use the SQL implementation — this is not shared across instances.
/// </summary>
public sealed class InMemoryQuickScanGlobalBudgetReservationStore : IQuickScanGlobalBudgetReservationStore
{
    private readonly object _sync = new();

    private readonly Dictionary<string, decimal> _hourReservedUsd = new(StringComparer.Ordinal);

    private readonly Dictionary<string, decimal> _dayReservedUsd = new(StringComparer.Ordinal);

    private readonly Dictionary<string, decimal> _hourCommittedUsd = new(StringComparer.Ordinal);

    private readonly Dictionary<string, decimal> _dayCommittedUsd = new(StringComparer.Ordinal);

    private readonly Dictionary<Guid, ReservationRow> _reservations = new();

    private readonly Dictionary<string, Guid> _idempotencyIndex = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<QuickScanGlobalBudgetReservationStoreResult> TryReserveAsync(
        QuickScanGlobalBudgetReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ReserveUsd <= 0m)
        {
            return Task.FromResult(QuickScanGlobalBudgetReservationStoreResult.Permit(request.ReservationId));
        }

        string hourKey = QuickScanGlobalBudgetBucketKeys.BuildHourBucketKey(request.UtcNow);
        string dayKey = QuickScanGlobalBudgetBucketKeys.BuildDayBucketKey(request.UtcNow);
        string idempotencyHash = HashIdempotencyKey(request.IdempotencyKey);
        decimal hourCeiling = QuickScanGlobalBudgetBucketKeys.ApplyGrace(request.MaxHourUsd, request.AccountingGracePercent);
        decimal dayCeiling = QuickScanGlobalBudgetBucketKeys.ApplyGrace(request.MaxDayUsd, request.AccountingGracePercent);
        DateTimeOffset expiresUtc = request.UtcNow + request.ReservationTtl;

        lock (_sync)
        {
            ExpireReservations(request.UtcNow);

            if (_idempotencyIndex.TryGetValue(idempotencyHash, out Guid existingId)
                && _reservations.TryGetValue(existingId, out ReservationRow? existing)
                && existing.Status == QuickScanReservationRowStatus.Pending
                && existing.ExpiresUtc > request.UtcNow)
            {
                return Task.FromResult(QuickScanGlobalBudgetReservationStoreResult.Permit(existingId));
            }

        decimal hourReserved = GetReserved(_hourReservedUsd, hourKey);
        decimal dayReserved = GetReserved(_dayReservedUsd, dayKey);
        decimal hourCommitted = GetCommitted(_hourCommittedUsd, hourKey);
        decimal dayCommitted = GetCommitted(_dayCommittedUsd, dayKey);

        if (hourReserved + hourCommitted + request.ReserveUsd > hourCeiling)
            {
                return Task.FromResult(
                    QuickScanGlobalBudgetReservationStoreResult.Reject(
                        QuickScanGlobalBudgetReservationStoreRejectionReason.HourlyCeilingExceeded));
            }

            if (dayReserved + dayCommitted + request.ReserveUsd > dayCeiling)
            {
                return Task.FromResult(
                    QuickScanGlobalBudgetReservationStoreResult.Reject(
                        QuickScanGlobalBudgetReservationStoreRejectionReason.DailyCeilingExceeded));
            }

            _hourReservedUsd[hourKey] = hourReserved + request.ReserveUsd;
            _dayReservedUsd[dayKey] = dayReserved + request.ReserveUsd;

            ReservationRow row = new()
            {
                ReservationId = request.ReservationId,
                IdempotencyHash = idempotencyHash,
                HourBucketKey = hourKey,
                DayBucketKey = dayKey,
                ReservedUsd = request.ReserveUsd,
                ExpiresUtc = expiresUtc,
                Status = QuickScanReservationRowStatus.Pending,
            };

            _reservations[request.ReservationId] = row;
            _idempotencyIndex[idempotencyHash] = request.ReservationId;
        }

        return Task.FromResult(QuickScanGlobalBudgetReservationStoreResult.Permit(request.ReservationId));
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
                || row.Status != QuickScanReservationRowStatus.Pending)
            {
                return Task.CompletedTask;
            }

            ReleaseBucketAmount(_hourReservedUsd, row.HourBucketKey, row.ReservedUsd);
            ReleaseBucketAmount(_dayReservedUsd, row.DayBucketKey, row.ReservedUsd);
            AddBucketAmount(_hourCommittedUsd, row.HourBucketKey, actualUsd);
            AddBucketAmount(_dayCommittedUsd, row.DayBucketKey, actualUsd);
            row.Status = QuickScanReservationRowStatus.Committed;
            row.CommittedUsd = actualUsd;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            if (!_reservations.TryGetValue(reservationId, out ReservationRow? row)
                || row.Status != QuickScanReservationRowStatus.Pending)
            {
                return Task.CompletedTask;
            }

            ReleaseBucketAmount(_hourReservedUsd, row.HourBucketKey, row.ReservedUsd);
            ReleaseBucketAmount(_dayReservedUsd, row.DayBucketKey, row.ReservedUsd);
            row.Status = QuickScanReservationRowStatus.Released;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<QuickScanGlobalBudgetBucketSnapshot> GetBucketSnapshotAsync(
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default)
    {
        string hourKey = QuickScanGlobalBudgetBucketKeys.BuildHourBucketKey(utcNow);
        string dayKey = QuickScanGlobalBudgetBucketKeys.BuildDayBucketKey(utcNow);

        lock (_sync)
        {
            ExpireReservations(utcNow);

            int pendingCount = _reservations.Values.Count(row => row.Status == QuickScanReservationRowStatus.Pending);
            int expiredPendingCount = _reservations.Values.Count(
                row => row.Status == QuickScanReservationRowStatus.Pending && row.ExpiresUtc <= utcNow);

            QuickScanGlobalBudgetBucketSnapshot snapshot = new()
            {
                HourBucketKey = hourKey,
                DayBucketKey = dayKey,
                HourReservedUsd = GetReserved(_hourReservedUsd, hourKey),
                HourCommittedUsd = GetCommitted(_hourCommittedUsd, hourKey),
                DayReservedUsd = GetReserved(_dayReservedUsd, dayKey),
                DayCommittedUsd = GetCommitted(_dayCommittedUsd, dayKey),
                PendingReservationCount = pendingCount,
                ExpiredPendingReservationCount = expiredPendingCount,
            };

            return Task.FromResult(snapshot);
        }
    }

    /// <inheritdoc />
    public Task<QuickScanBudgetReconciliationResult> ReconcileExpiredReservationsAsync(
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default)
    {
        int expiredCount = 0;

        lock (_sync)
        {
            foreach (ReservationRow row in _reservations.Values)
            {
                if (row.Status != QuickScanReservationRowStatus.Pending || row.ExpiresUtc > utcNow)
                {
                    continue;
                }

                ReleaseBucketAmount(_hourReservedUsd, row.HourBucketKey, row.ReservedUsd);
                ReleaseBucketAmount(_dayReservedUsd, row.DayBucketKey, row.ReservedUsd);
                row.Status = QuickScanReservationRowStatus.Expired;
                expiredCount++;
            }
        }

        return Task.FromResult(
            new QuickScanBudgetReconciliationResult
            {
                ExpiredReservationCount = expiredCount,
                ReconciledUtc = utcNow,
            });
    }

    private void ExpireReservations(DateTimeOffset utcNow)
    {
        foreach (ReservationRow row in _reservations.Values)
        {
            if (row.Status != QuickScanReservationRowStatus.Pending || row.ExpiresUtc > utcNow)
            {
                continue;
            }

            ReleaseBucketAmount(_hourReservedUsd, row.HourBucketKey, row.ReservedUsd);
            ReleaseBucketAmount(_dayReservedUsd, row.DayBucketKey, row.ReservedUsd);
            row.Status = QuickScanReservationRowStatus.Expired;
        }
    }

    private static decimal GetReserved(Dictionary<string, decimal> store, string key) =>
        store.TryGetValue(key, out decimal value) ? value : 0m;

    private static decimal GetCommitted(Dictionary<string, decimal> store, string key) =>
        store.TryGetValue(key, out decimal value) ? value : 0m;

    private static void AddBucketAmount(Dictionary<string, decimal> store, string key, decimal amount)
    {
        if (amount <= 0m)
        {
            return;
        }

        store[key] = GetReserved(store, key) + amount;
    }

    private static void ReleaseBucketAmount(Dictionary<string, decimal> store, string key, decimal amount)
    {
        if (amount <= 0m)
        {
            return;
        }

        decimal current = GetReserved(store, key);
        decimal next = Math.Max(0m, current - amount);

        if (next <= 0m)
        {
            store.Remove(key);

            return;
        }

        store[key] = next;
    }

    private static string HashIdempotencyKey(string idempotencyKey)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(idempotencyKey.Trim()));

        return Convert.ToHexString(hash);
    }

    private enum QuickScanReservationRowStatus
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

        public required string HourBucketKey { get; init; }

        public required string DayBucketKey { get; init; }

        public required decimal ReservedUsd { get; init; }

        public decimal CommittedUsd { get; set; }

        public required DateTimeOffset ExpiresUtc { get; init; }

        public QuickScanReservationRowStatus Status { get; set; }
    }
}
