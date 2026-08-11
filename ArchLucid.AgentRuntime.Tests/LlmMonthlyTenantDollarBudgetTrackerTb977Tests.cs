using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmMonthlyTenantDollarBudgetTrackerTb977Tests
{
    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_blocks_when_in_flight_reservation_ceiling_reached()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 500m,
            HardCutoffUsdPerUtcMonth = 5000m,
            AssumedMaxPromptTokensPerRequest = 1,
            AssumedMaxCompletionTokensPerRequest = 1,
            MaxConcurrentInFlightMonthlyReservations = 1
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(1m);

        InMemoryLlmTenantBudgetRepository repo = new();
        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, repo);
        Guid tenant = Guid.NewGuid();

        (decimal? firstReserved, _) =
            await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);

        firstReserved.Should().Be(1m);

        Func<Task> act = async () =>
            await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);

        await act.Should().ThrowAsync<LlmTokenQuotaExceededException>()
            .WithMessage("*admission temporarily limited*");
    }

    [SkippableFact]
    public async Task RecordUsageAndMaybeWarn_releases_in_flight_slot_after_settle()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 500m,
            HardCutoffUsdPerUtcMonth = 5000m,
            AssumedMaxPromptTokensPerRequest = 1,
            AssumedMaxCompletionTokensPerRequest = 1,
            MaxConcurrentInFlightMonthlyReservations = 1
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(1m);

        InMemoryLlmTenantBudgetRepository repo = new();
        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, repo);
        Guid tenant = Guid.NewGuid();
        IScopeContextProvider scope = CreateScopeProvider(tenant);

        (decimal? reserved, _) =
            await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);

        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            scope,
            null,
            1,
            1,
            reserved,
            false,
            CancellationToken.None);

        await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);
    }

    [SkippableFact]
    public async Task Reserve_uses_sql_authoritative_period_key_from_repository()
    {
        StubPeriodKeyBudgetRepository repo = new() { AuthoritativePeriodKey = "2099-12" };

        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 500m,
            HardCutoffUsdPerUtcMonth = 5000m,
            AssumedMaxPromptTokensPerRequest = 1,
            AssumedMaxCompletionTokensPerRequest = 1,
            MaxConcurrentInFlightMonthlyReservations = 8
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(1m);

        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, repo);
        Guid tenant = Guid.NewGuid();

        (decimal? reserved, _) =
            await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);

        reserved.Should().Be(1m);
        repo.LastReservePeriodKey.Should().Be("2099-12");
    }

    private static LlmMonthlyTenantDollarBudgetTracker CreateTracker(
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> options,
        ILlmCostEstimator costEstimator,
        ILlmTenantBudgetRepository repository)
    {
        return new LlmMonthlyTenantDollarBudgetTracker(
            options,
            costEstimator,
            repository,
            new NoOpLlmTenantWalletService(),
            new PassthroughTenantLlmMonthlyBudgetCapResolver(),
            new ConfigurationBuilder().Build(),
            new NonProductionTestHostEnvironment(),
            TimeProvider.System);
    }

    private static IScopeContextProvider CreateScopeProvider(Guid tenantId)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        return scope.Object;
    }

    private sealed class StubPeriodKeyBudgetRepository : ILlmTenantBudgetRepository
    {
        private readonly InMemoryLlmTenantBudgetRepository _inner = new();

        public string AuthoritativePeriodKey { get; set; } = "2026-01";

        public string? LastReservePeriodKey { get; private set; }

        public Task<LlmTenantBudgetStateReadModel> GetOrCreateAsync(
            Guid tenantId,
            LlmBudgetPeriod period,
            string periodKey,
            CancellationToken cancellationToken = default)
        {
            return _inner.GetOrCreateAsync(tenantId, period, periodKey, cancellationToken);
        }

        public Task<string> GetSqlUtcMonthlyPeriodKeyAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(AuthoritativePeriodKey);
        }

        public async Task<LlmTenantBudgetReserveResult> ReserveAsync(
            LlmTenantBudgetReserveRequest request,
            CancellationToken cancellationToken = default)
        {
            LastReservePeriodKey = request.PeriodKey;

            return await _inner.ReserveAsync(request, cancellationToken).ConfigureAwait(false);
        }

        public Task<LlmTenantBudgetSettleResult> SettleAsync(
            LlmTenantBudgetSettleRequest request,
            CancellationToken cancellationToken = default)
        {
            return _inner.SettleAsync(request, cancellationToken);
        }
    }
}
