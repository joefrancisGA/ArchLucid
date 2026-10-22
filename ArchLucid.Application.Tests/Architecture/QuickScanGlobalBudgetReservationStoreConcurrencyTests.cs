using ArchLucid.Application.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanGlobalBudgetReservationStoreConcurrencyTests
{
    private static readonly DateTimeOffset BaseUtc = new(2026, 7, 20, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task TryReserveAsync_concurrent_reservations_never_exceed_hourly_ceiling()
    {
        InMemoryQuickScanGlobalBudgetReservationStore store = new();
        const int workerCount = 24;
        const decimal reserveUsd = 1m;
        const decimal maxHourUsd = 5m;
        int allowedCount = 0;

        await Parallel.ForAsync(
            0,
            workerCount,
            new ParallelOptions { MaxDegreeOfParallelism = 12 },
            async (index, _) =>
            {
                QuickScanGlobalBudgetReservationRequest request = BuildRequest(
                    reservationId: Guid.NewGuid(),
                    idempotencyKey: $"worker-{index}",
                    reserveUsd: reserveUsd,
                    maxHourUsd: maxHourUsd,
                    maxDayUsd: 100m);

                QuickScanGlobalBudgetReservationStoreResult result =
                    await store.TryReserveAsync(request);

                if (result.Allowed)
                {
                    Interlocked.Increment(ref allowedCount);
                }
            });

        allowedCount.Should().Be(5);
    }

    [Fact]
    public async Task TryReserveAsync_is_idempotent_for_same_key()
    {
        InMemoryQuickScanGlobalBudgetReservationStore store = new();
        Guid reservationId = Guid.NewGuid();

        QuickScanGlobalBudgetReservationRequest request = BuildRequest(
            reservationId,
            idempotencyKey: "same-key",
            reserveUsd: 1m,
            maxHourUsd: 5m,
            maxDayUsd: 25m);

        QuickScanGlobalBudgetReservationStoreResult first = await store.TryReserveAsync(request);
        QuickScanGlobalBudgetReservationStoreResult second = await store.TryReserveAsync(
            BuildRequest(Guid.NewGuid(), "same-key", 1m, 5m, 25m));

        first.Allowed.Should().BeTrue();
        second.Allowed.Should().BeTrue();
        second.ReservationId.Should().Be(reservationId);
    }

    [Fact]
    public async Task TryReserveAsync_uses_distinct_utc_hour_buckets()
    {
        InMemoryQuickScanGlobalBudgetReservationStore store = new();

        QuickScanGlobalBudgetReservationStoreResult hourOne = await store.TryReserveAsync(
            BuildRequest(Guid.NewGuid(), "hour-1", 4m, 5m, 25m, BaseUtc));
        QuickScanGlobalBudgetReservationStoreResult hourTwo = await store.TryReserveAsync(
            BuildRequest(Guid.NewGuid(), "hour-2", 4m, 5m, 25m, BaseUtc.AddHours(1)));

        hourOne.Allowed.Should().BeTrue();
        hourTwo.Allowed.Should().BeTrue();
    }

    [Fact]
    public async Task Service_rejects_when_store_unavailable()
    {
        Mock<IQuickScanGlobalBudgetReservationStore> store = new();
        store
            .Setup(s => s.TryReserveAsync(It.IsAny<QuickScanGlobalBudgetReservationRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("redis down"));

        QuickScanGlobalBudgetReservationService service = CreateService(store.Object);

        QuickScanGlobalBudgetReservationAttemptResult result = await service.TryReserveAsync(
            "idem-1",
            0.01m,
            BaseUtc,
            CancellationToken.None);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanGlobalBudgetReservationRejectionReason.StoreUnavailable);
    }

    private static QuickScanGlobalBudgetReservationRequest BuildRequest(
        Guid reservationId,
        string idempotencyKey,
        decimal reserveUsd,
        decimal maxHourUsd,
        decimal maxDayUsd,
        DateTimeOffset? utcNow = null) =>
        new()
        {
            ReservationId = reservationId,
            IdempotencyKey = idempotencyKey,
            UtcNow = utcNow ?? BaseUtc,
            ReserveUsd = reserveUsd,
            MaxHourUsd = maxHourUsd,
            MaxDayUsd = maxDayUsd,
            AccountingGracePercent = 0m,
            ReservationTtl = TimeSpan.FromMinutes(15),
        };

    private static QuickScanGlobalBudgetReservationService CreateService(IQuickScanGlobalBudgetReservationStore store)
    {
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Enabled = true,
            GlobalBudget = new QuickScanSafetyGlobalBudgetLimits
            {
                MaxAnonymousSpendPerHour = 5m,
                MaxAnonymousSpendPerDay = 25m,
            },
        });

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.Normal,
                AnonymousExecutionAllowed = true,
                SampleResultAvailable = true,
                PublicMessage = string.Empty,
                StoreHealthy = true,
            });

        return new QuickScanGlobalBudgetReservationService(
            options.Object,
            store,
            operational.Object,
            NullLogger<QuickScanGlobalBudgetReservationService>.Instance);
    }
}
