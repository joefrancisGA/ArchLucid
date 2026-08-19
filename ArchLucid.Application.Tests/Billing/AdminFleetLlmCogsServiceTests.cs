using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class AdminFleetLlmCogsServiceTests
{
    [SkippableFact]
    public async Task BuildDashboardAsync_WhenNoUsage_ReturnsCompleteHealthyRow()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        AdminFleetLlmCogsService sut = CreateService(
            [Tenant(tenantId, "Acme")],
            new InMemoryLlmTenantBudgetRepository(),
            new LlmMonthlyTenantDollarBudgetOptions
            {
                Enabled = true,
                IncludedUsdPerUtcMonth = 50m,
                HardCutoffUsdPerUtcMonth = 100m,
            },
            new LlmCostEstimationOptions
            {
                Enabled = true,
                InputUsdPerMillionTokens = 0.5m,
                OutputUsdPerMillionTokens = 1.5m,
            });

        AdminFleetLlmCogsDashboardResponse result = await sut.BuildDashboardAsync();

        AdminFleetLlmCogsRowResponse row = result.Rows.Should().ContainSingle().Subject;
        row.EstimatedUsdPressureUtcMonth.Should().Be(0m);
        row.GrossMarginRiskLabel.Should().Be("healthy");
        row.BudgetCompletionLabel.Should().Be("complete");
        row.CostRatesConfigured.Should().BeTrue();
        result.BudgetWarningTenantCount.Should().Be(0);
    }

    [SkippableFact]
    public async Task BuildDashboardAsync_WhenNearThreshold_ReturnsWarnCompletionSignal()
    {
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        InMemoryLlmTenantBudgetRepository repository = new();
        await SettleMonthlySpendAsync(repository, tenantId, 90m);
        AdminFleetLlmCogsService sut = CreateService([Tenant(tenantId, "Beta")], repository);

        AdminFleetLlmCogsDashboardResponse result = await sut.BuildDashboardAsync();

        AdminFleetLlmCogsRowResponse row = result.Rows.Should().ContainSingle().Subject;
        row.GrossMarginRiskLabel.Should().Be("warn");
        row.BudgetCompletionLabel.Should().Be("near-threshold");
        row.BlocksAdditionalLlmExecution.Should().BeFalse();
        result.BudgetWarningTenantCount.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildDashboardAsync_WhenHardStopReached_ReturnsRiskCompletionSignal()
    {
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        InMemoryLlmTenantBudgetRepository repository = new();
        await SettleMonthlySpendAsync(repository, tenantId, 101m);
        AdminFleetLlmCogsService sut = CreateService([Tenant(tenantId, "Gamma")], repository);

        AdminFleetLlmCogsDashboardResponse result = await sut.BuildDashboardAsync();

        AdminFleetLlmCogsRowResponse row = result.Rows.Should().ContainSingle().Subject;
        row.GrossMarginRiskLabel.Should().Be("risk");
        row.BudgetCompletionLabel.Should().Be("hard-stop");
        row.BlocksAdditionalLlmExecution.Should().BeTrue();
        result.HardStopTenantCount.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildDashboardAsync_WhenCostRatesMissing_ReturnsAdvisorySignal()
    {
        Guid tenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        AdminFleetLlmCogsService sut = CreateService(
            [Tenant(tenantId, "Delta")],
            new InMemoryLlmTenantBudgetRepository(),
            new LlmMonthlyTenantDollarBudgetOptions
            {
                Enabled = true,
                IncludedUsdPerUtcMonth = 50m,
                HardCutoffUsdPerUtcMonth = 100m,
            },
            new LlmCostEstimationOptions
            {
                Enabled = true,
                InputUsdPerMillionTokens = 0m,
                OutputUsdPerMillionTokens = 0m,
            });

        AdminFleetLlmCogsDashboardResponse result = await sut.BuildDashboardAsync();

        AdminFleetLlmCogsRowResponse row = result.Rows.Should().ContainSingle().Subject;
        row.CostRatesConfigured.Should().BeFalse();
        row.BudgetCompletionLabel.Should().Be("missing-cost-rates");
        result.MissingRateTenantCount.Should().Be(1);
    }

    private static AdminFleetLlmCogsService CreateService(
        IReadOnlyList<TenantRecord> tenants,
        InMemoryLlmTenantBudgetRepository repository,
        LlmMonthlyTenantDollarBudgetOptions? budgetOptions = null,
        LlmCostEstimationOptions? costOptions = null)
    {
        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(r => r.ListAsync(It.IsAny<CancellationToken>())).ReturnsAsync(tenants);
        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> budgetMonitor = new();
        budgetMonitor.Setup(m => m.CurrentValue).Returns(
            budgetOptions
            ?? new LlmMonthlyTenantDollarBudgetOptions
            {
                Enabled = true,
                IncludedUsdPerUtcMonth = 50m,
                HardCutoffUsdPerUtcMonth = 100m,
            });
        Mock<IOptionsMonitor<LlmCostEstimationOptions>> costMonitor = new();
        costMonitor.Setup(m => m.CurrentValue).Returns(
            costOptions
            ?? new LlmCostEstimationOptions
            {
                Enabled = true,
                InputUsdPerMillionTokens = 0.5m,
                OutputUsdPerMillionTokens = 1.5m,
            });

        return new AdminFleetLlmCogsService(
            new FixedUtcTimeProvider(new DateTime(2026, 5, 14, 12, 0, 0, DateTimeKind.Utc)),
            tenantRepository.Object,
            repository,
            budgetMonitor.Object,
            costMonitor.Object);
    }

    private static async Task SettleMonthlySpendAsync(
        InMemoryLlmTenantBudgetRepository repository,
        Guid tenantId,
        decimal actualUsd)
    {
        LlmTenantBudgetStateReadModel row = await repository.GetOrCreateAsync(
            tenantId,
            LlmBudgetPeriod.Monthly,
            "2026-05",
            CancellationToken.None);

        await repository.SettleAsync(
            new LlmTenantBudgetSettleRequest
            {
                TenantId = tenantId,
                Period = LlmBudgetPeriod.Monthly,
                PeriodKey = "2026-05",
                ActualUsd = actualUsd,
                ReleaseReservedUsd = 0m,
                WarnAtUsd = 999_999m,
                ExpectedRowVersion = row.RowVersion,
            },
            CancellationToken.None);
    }

    private static TenantRecord Tenant(Guid tenantId, string name) =>
        new()
        {
            Id = tenantId,
            Name = name,
            Slug = name.ToLowerInvariant(),
            Tier = TenantTier.Standard,
            CreatedUtc = new DateTimeOffset(2026, 5, 1, 0, 0, 0, TimeSpan.Zero),
        };

    private sealed class FixedUtcTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow, TimeSpan.Zero);
    }
}
