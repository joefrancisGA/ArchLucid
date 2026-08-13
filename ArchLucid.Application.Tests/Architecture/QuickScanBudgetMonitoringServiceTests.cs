using ArchLucid.Application.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

public sealed class QuickScanBudgetMonitoringServiceTests
{
    [Fact]
    public async Task ReconcileAsync_releases_expired_pending_reservations()
    {
        InMemoryQuickScanGlobalBudgetReservationStore budgetStore = new();
        InMemoryQuickScanUsageRecordStore usageStore = new();
        FakeTimeProvider time = new(DateTimeOffset.Parse("2026-08-12T12:00:00Z"));

        QuickScanGlobalBudgetReservationRequest request = new()
        {
            ReservationId = Guid.NewGuid(),
            IdempotencyKey = "idem-1",
            UtcNow = time.GetUtcNow(),
            ReserveUsd = 1.25m,
            MaxHourUsd = 10m,
            MaxDayUsd = 20m,
            AccountingGracePercent = 0m,
            ReservationTtl = TimeSpan.FromMinutes(5),
        };

        await budgetStore.TryReserveAsync(request, CancellationToken.None);

        time.Advance(TimeSpan.FromMinutes(10));

        QuickScanBudgetMonitoringService sut = CreateSut(budgetStore, usageStore, time);

        QuickScanBudgetReconciliationResult result = await sut.ReconcileAsync(CancellationToken.None);

        result.ExpiredReservationCount.Should().Be(1);

        QuickScanBudgetMonitoringSnapshot snapshot = await sut.GetSnapshotAsync(CancellationToken.None);

        snapshot.Buckets.HourReservedUsd.Should().Be(0m);
        snapshot.Buckets.PendingReservationCount.Should().Be(0);
    }

    [Fact]
    public async Task GetSnapshotAsync_returns_recent_usage_records()
    {
        InMemoryQuickScanGlobalBudgetReservationStore budgetStore = new();
        InMemoryQuickScanUsageRecordStore usageStore = new();
        FakeTimeProvider time = new(DateTimeOffset.Parse("2026-08-12T12:00:00Z"));

        await usageStore.InsertAsync(
            new QuickScanUsageRecord
            {
                Status = "success",
                RouteKind = "marketing",
                ClientIpHash = "abc",
                SessionIdHash = "def",
                OccurredUtc = time.GetUtcNow(),
            },
            CancellationToken.None);

        QuickScanBudgetMonitoringService sut = CreateSut(budgetStore, usageStore, time);

        QuickScanBudgetMonitoringSnapshot snapshot = await sut.GetSnapshotAsync(CancellationToken.None);

        snapshot.RecentUsage.Should().ContainSingle(row => row.Status == "success");
        snapshot.SafetyEnabled.Should().BeTrue();
    }

    private static QuickScanBudgetMonitoringService CreateSut(
        IQuickScanGlobalBudgetReservationStore budgetStore,
        IQuickScanUsageRecordStore usageStore,
        TimeProvider timeProvider)
    {
        IOptionsMonitor<QuickScanSafetyOptions> options = new TestSafetyOptionsMonitor(
            new QuickScanSafetyOptions
            {
                Enabled = true,
                GlobalBudget = new QuickScanSafetyGlobalBudgetLimits
                {
                    MaxAnonymousSpendPerHour = 25m,
                    MaxAnonymousSpendPerDay = 100m,
                },
            });

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new QuickScanSafetyOperationalSnapshot
                {
                    Mode = QuickScanSafetyOperationalMode.Normal,
                    AnonymousExecutionAllowed = true,
                    SampleResultAvailable = true,
                    PublicMessage = string.Empty,
                    StoreHealthy = true,
                });

        return new QuickScanBudgetMonitoringService(
            options,
            budgetStore,
            usageStore,
            operational.Object,
            NullLogger<QuickScanBudgetMonitoringService>.Instance,
            timeProvider);
    }

    private sealed class FakeTimeProvider(DateTimeOffset start) : TimeProvider
    {
        private DateTimeOffset _utcNow = start;

        public override DateTimeOffset GetUtcNow() => _utcNow;

        public void Advance(TimeSpan delta) => _utcNow += delta;
    }

    private sealed class TestSafetyOptionsMonitor(QuickScanSafetyOptions value) : IOptionsMonitor<QuickScanSafetyOptions>
    {
        public QuickScanSafetyOptions CurrentValue => value;

        public QuickScanSafetyOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanSafetyOptions, string?> listener) => null;
    }
}
