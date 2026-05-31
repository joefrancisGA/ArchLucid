using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Budgeting;

[Trait("Category", "Unit")]
public sealed class LlmMonthlyTenantDollarBudgetStatusServiceTests
{
    [SkippableFact]
    public async Task GetStatusAsync_WhenMonitoringDisabled_ReturnsInactive()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        InMemoryLlmTenantBudgetRepository repo = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });
        Mock<ILlmCostEstimator> cost = new();
        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(
            new LlmMonthlyTenantDollarBudgetOptions { Enabled = false, HardCutoffUsdPerUtcMonth = 75m });

        LlmMonthlyTenantDollarBudgetStatusService sut = new(
            new FixedUtcTimeProvider(new DateTime(2026, 5, 14, 12, 0, 0, DateTimeKind.Utc)),
            monitor.Object,
            cost.Object,
            repo,
            scope.Object);

        LlmMonthlyTenantDollarBudgetStatusResult r = await sut.GetStatusAsync();

        r.MonthlyBudgetMonitoringActive.Should().BeFalse();
        r.BlocksAdditionalLlmExecution.Should().BeFalse();
        r.UtcMonth.Should().Be("2026-05");
        r.HardCutoffUsdPerUtcMonth.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetStatusAsync_WhenNextReservationWouldExceedHardCap_SetsBlocksTrue()
    {
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        InMemoryLlmTenantBudgetRepository repo = new();
        const string periodKey = "2026-05";
        LlmTenantBudgetStateReadModel row =
            await repo.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, CancellationToken.None);
        LlmTenantBudgetSettleResult settled = await repo.SettleAsync(
            new LlmTenantBudgetSettleRequest
            {
                TenantId = tenantId,
                Period = LlmBudgetPeriod.Monthly,
                PeriodKey = periodKey,
                ActualUsd = 100m,
                ReleaseReservedUsd = 0m,
                WarnAtUsd = 999_999m,
                ExpectedRowVersion = row.RowVersion
            },
            CancellationToken.None);
        settled.NewState.Should().NotBeNull();
        settled.NewState!.CommittedUsd.Should().Be(100m);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(c => c.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(1m);
        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(
            new LlmMonthlyTenantDollarBudgetOptions
            {
                Enabled = true,
                HardCutoffUsdPerUtcMonth = 75m,
                AssumedMaxPromptTokensPerRequest = 100,
                AssumedMaxCompletionTokensPerRequest = 100
            });

        LlmMonthlyTenantDollarBudgetStatusService sut = new(
            new FixedUtcTimeProvider(new DateTime(2026, 5, 14, 12, 0, 0, DateTimeKind.Utc)),
            monitor.Object,
            cost.Object,
            repo,
            scope.Object);

        LlmMonthlyTenantDollarBudgetStatusResult r = await sut.GetStatusAsync();

        r.MonthlyBudgetMonitoringActive.Should().BeTrue();
        r.BlocksAdditionalLlmExecution.Should().BeTrue();
        r.EstimatedUsdPressure.Should().Be(100m);
        r.AssumedNextCallReservationUsd.Should().Be(1m);
        r.EffectiveHardCapUsd.Should().Be(75m);
        r.HardCapUtilizationFraction.Should().BeApproximately(100.0 / 75.0, 0.0001);
        r.WarnFraction.Should().Be(0.75m);
    }

    [SkippableFact]
    public async Task GetStatusAsync_WhenMonitoringActive_ExposesUtilizationAndWarnFraction()
    {
        Guid tenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        InMemoryLlmTenantBudgetRepository repo = new();
        const string periodKey = "2026-05";
        LlmTenantBudgetStateReadModel row =
            await repo.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, CancellationToken.None);
        LlmTenantBudgetSettleResult settled = await repo.SettleAsync(
            new LlmTenantBudgetSettleRequest
            {
                TenantId = tenantId,
                Period = LlmBudgetPeriod.Monthly,
                PeriodKey = periodKey,
                ActualUsd = 30m,
                ReleaseReservedUsd = 0m,
                WarnAtUsd = 999_999m,
                ExpectedRowVersion = row.RowVersion
            },
            CancellationToken.None);
        settled.NewState.Should().NotBeNull();

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(c => c.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(1m);
        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(
            new LlmMonthlyTenantDollarBudgetOptions
            {
                Enabled = true,
                HardCutoffUsdPerUtcMonth = 100m,
                WarnFraction = 0.8m,
                AssumedMaxPromptTokensPerRequest = 100,
                AssumedMaxCompletionTokensPerRequest = 100
            });

        LlmMonthlyTenantDollarBudgetStatusService sut = new(
            new FixedUtcTimeProvider(new DateTime(2026, 5, 14, 12, 0, 0, DateTimeKind.Utc)),
            monitor.Object,
            cost.Object,
            repo,
            scope.Object);

        LlmMonthlyTenantDollarBudgetStatusResult r = await sut.GetStatusAsync();

        r.HardCapUtilizationFraction.Should().BeApproximately(0.3, 0.0001);
        r.WarnFraction.Should().Be(0.8m);
    }

    [SkippableFact]
    public async Task GetStatusAsync_WhenEstimatorReturnsNoUsd_DoesNotBlock()
    {
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        InMemoryLlmTenantBudgetRepository repo = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(c => c.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns((decimal?)null);
        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(
            new LlmMonthlyTenantDollarBudgetOptions
            {
                Enabled = true,
                HardCutoffUsdPerUtcMonth = 75m
            });

        LlmMonthlyTenantDollarBudgetStatusService sut = new(
            new FixedUtcTimeProvider(new DateTime(2026, 5, 14, 12, 0, 0, DateTimeKind.Utc)),
            monitor.Object,
            cost.Object,
            repo,
            scope.Object);

        LlmMonthlyTenantDollarBudgetStatusResult r = await sut.GetStatusAsync();

        r.MonthlyBudgetMonitoringActive.Should().BeTrue();
        r.BlocksAdditionalLlmExecution.Should().BeFalse();
        r.AssumedNextCallReservationUsd.Should().BeNull();
    }

    private sealed class FixedUtcTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow, TimeSpan.Zero);
    }
}
