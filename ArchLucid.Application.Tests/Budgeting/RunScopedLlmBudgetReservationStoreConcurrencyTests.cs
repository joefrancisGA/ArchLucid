using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Budgeting;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Budgeting;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunScopedLlmBudgetReservationStoreConcurrencyTests
{
    [Fact]
    public async Task Concurrent_reserves_cannot_exceed_monthly_ceiling()
    {
        InMemoryRunScopedLlmBudgetReservationStore store = new();
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        DateTimeOffset utcNow = DateTimeOffset.Parse("2026-07-24T12:00:00Z");
        const decimal hardCap = 10m;
        const decimal pressure = 0m;
        const decimal eachReserve = 6m;

        Task<RunScopedLlmBudgetReservationStoreResult>[] tasks = Enumerable.Range(0, 8)
            .Select(i => store.TryReserveAsync(
                new RunScopedLlmBudgetReservationRequest
                {
                    ReservationId = Guid.NewGuid(),
                    TenantId = tenantId,
                    RunId = $"run-{i:D2}",
                    IdempotencyKey = $"idem-{i:D2}",
                    PeriodKey = "2026-07",
                    UtcNow = utcNow,
                    ReserveUsd = eachReserve,
                    CurrentPressureUsd = pressure,
                    HardCapUsd = hardCap,
                    AccountingGracePercent = 0m,
                    ReservationTtl = TimeSpan.FromMinutes(30),
                }))
            .ToArray();

        RunScopedLlmBudgetReservationStoreResult[] results = await Task.WhenAll(tasks);

        int allowed = results.Count(static r => r.Allowed);
        int rejected = results.Count(static r => !r.Allowed);

        allowed.Should().Be(1);
        rejected.Should().Be(7);
        results.Where(static r => !r.Allowed)
            .Should()
            .OnlyContain(static r =>
                r.RejectionReason == RunScopedLlmBudgetReservationStoreRejectionReason.MonthlyCeilingExceeded);
    }

    [Fact]
    public async Task Idempotent_reserve_returns_same_reservation()
    {
        InMemoryRunScopedLlmBudgetReservationStore store = new();
        Guid reservationId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        DateTimeOffset utcNow = DateTimeOffset.Parse("2026-07-24T12:00:00Z");

        RunScopedLlmBudgetReservationRequest request = new()
        {
            ReservationId = reservationId,
            TenantId = tenantId,
            RunId = "run-idem",
            IdempotencyKey = "same-key",
            PeriodKey = "2026-07",
            UtcNow = utcNow,
            ReserveUsd = 3m,
            CurrentPressureUsd = 0m,
            HardCapUsd = 100m,
            AccountingGracePercent = 0m,
            ReservationTtl = TimeSpan.FromMinutes(30),
        };

        RunScopedLlmBudgetReservationStoreResult first = await store.TryReserveAsync(request);
        RunScopedLlmBudgetReservationStoreResult second = await store.TryReserveAsync(
            new RunScopedLlmBudgetReservationRequest
            {
                ReservationId = Guid.NewGuid(),
                TenantId = request.TenantId,
                RunId = request.RunId,
                IdempotencyKey = request.IdempotencyKey,
                PeriodKey = request.PeriodKey,
                UtcNow = request.UtcNow,
                ReserveUsd = request.ReserveUsd,
                CurrentPressureUsd = request.CurrentPressureUsd,
                HardCapUsd = request.HardCapUsd,
                AccountingGracePercent = request.AccountingGracePercent,
                ReservationTtl = request.ReservationTtl,
            });

        first.Allowed.Should().BeTrue();
        second.Allowed.Should().BeTrue();
        second.ReservationId.Should().Be(first.ReservationId);
    }

    [Fact]
    public async Task Release_frees_headroom_for_next_reserve()
    {
        InMemoryRunScopedLlmBudgetReservationStore store = new();
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        DateTimeOffset utcNow = DateTimeOffset.Parse("2026-07-24T12:00:00Z");

        RunScopedLlmBudgetReservationStoreResult first = await store.TryReserveAsync(
            new RunScopedLlmBudgetReservationRequest
            {
                ReservationId = Guid.NewGuid(),
                TenantId = tenantId,
                RunId = "run-a",
                IdempotencyKey = "a",
                PeriodKey = "2026-07",
                UtcNow = utcNow,
                ReserveUsd = 8m,
                CurrentPressureUsd = 0m,
                HardCapUsd = 10m,
                AccountingGracePercent = 0m,
                ReservationTtl = TimeSpan.FromMinutes(30),
            });

        first.Allowed.Should().BeTrue();
        await store.ReleaseAsync(first.ReservationId!.Value);

        RunScopedLlmBudgetReservationStoreResult second = await store.TryReserveAsync(
            new RunScopedLlmBudgetReservationRequest
            {
                ReservationId = Guid.NewGuid(),
                TenantId = tenantId,
                RunId = "run-b",
                IdempotencyKey = "b",
                PeriodKey = "2026-07",
                UtcNow = utcNow,
                ReserveUsd = 8m,
                CurrentPressureUsd = 0m,
                HardCapUsd = 10m,
                AccountingGracePercent = 0m,
                ReservationTtl = TimeSpan.FromMinutes(30),
            });

        second.Allowed.Should().BeTrue();
    }

    [Fact]
    public async Task After_commit_same_idempotency_key_can_reserve_again()
    {
        InMemoryRunScopedLlmBudgetReservationStore store = new();
        Guid tenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        DateTimeOffset utcNow = DateTimeOffset.Parse("2026-07-24T12:00:00Z");
        const string idempotencyKey = "tenant-run-execute";

        RunScopedLlmBudgetReservationStoreResult first = await store.TryReserveAsync(
            new RunScopedLlmBudgetReservationRequest
            {
                ReservationId = Guid.NewGuid(),
                TenantId = tenantId,
                RunId = "run-retry",
                IdempotencyKey = idempotencyKey,
                PeriodKey = "2026-07",
                UtcNow = utcNow,
                ReserveUsd = 4m,
                CurrentPressureUsd = 0m,
                HardCapUsd = 50m,
                AccountingGracePercent = 0m,
                ReservationTtl = TimeSpan.FromMinutes(30),
            });

        first.Allowed.Should().BeTrue();
        await store.CommitAsync(first.ReservationId!.Value, actualUsd: 3m);

        RunScopedLlmBudgetReservationStoreResult second = await store.TryReserveAsync(
            new RunScopedLlmBudgetReservationRequest
            {
                ReservationId = Guid.NewGuid(),
                TenantId = tenantId,
                RunId = "run-retry",
                IdempotencyKey = idempotencyKey,
                PeriodKey = "2026-07",
                UtcNow = utcNow,
                ReserveUsd = 4m,
                CurrentPressureUsd = 0m,
                HardCapUsd = 50m,
                AccountingGracePercent = 0m,
                ReservationTtl = TimeSpan.FromMinutes(30),
            });

        second.Allowed.Should().BeTrue();
        second.ReservationId.Should().NotBeNull();
        second.ReservationId!.Value.Should().NotBe(first.ReservationId!.Value);
    }
}
