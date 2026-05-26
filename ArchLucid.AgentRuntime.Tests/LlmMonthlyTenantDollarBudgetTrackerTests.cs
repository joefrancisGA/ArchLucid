using System.Globalization;

using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Core.Audit;
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
public sealed class LlmMonthlyTenantDollarBudgetTrackerTests
{
    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_when_under_hard_cutoff_does_not_throw()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 50m,
            HardCutoffUsdPerUtcMonth = 75m,
            WarnFraction = 0.75m,
            AssumedMaxPromptTokensPerRequest = 1,
            AssumedMaxCompletionTokensPerRequest = 1
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(5m);

        InMemoryLlmTenantBudgetRepository repo = new();
        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, repo);
        Guid tenant = Guid.NewGuid();

        await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", CreateScopeProvider(tenant), null, 100, 100, CancellationToken.None);
        await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);
    }

    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_when_would_exceed_hard_cutoff_throws()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 50m,
            HardCutoffUsdPerUtcMonth = 75m,
            AssumedMaxPromptTokensPerRequest = 1,
            AssumedMaxCompletionTokensPerRequest = 1
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(25m);

        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, new InMemoryLlmTenantBudgetRepository());
        Guid tenant = Guid.NewGuid();

        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", CreateScopeProvider(tenant), null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", CreateScopeProvider(tenant), null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", CreateScopeProvider(tenant), null, 10, 10, CancellationToken.None);

        Func<Task> act = async () =>
            await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);

        await act.Should().ThrowAsync<LlmTokenQuotaExceededException>();
    }

    [SkippableFact]
    public async Task RecordUsageAndMaybeWarn_warns_at_most_once_per_utc_month_when_threshold_crossed()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 50m,
            HardCutoffUsdPerUtcMonth = 75m,
            WarnFraction = 0.75m
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(12m);

        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, new InMemoryLlmTenantBudgetRepository());
        Guid tenant = Guid.NewGuid();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        IScopeContextProvider scopeProvider = CreateScopeProvider(tenant);

        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, audit.Object, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, audit.Object, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, audit.Object, 10, 10, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);

        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, audit.Object, 10, 10, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching),
                It.IsAny<CancellationToken>()),
            Times.Once);

        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, audit.Object, 1, 1, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_skips_for_simulator_provider()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 1m,
            HardCutoffUsdPerUtcMonth = 1m
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(100m);

        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, new InMemoryLlmTenantBudgetRepository());
        Guid tenant = Guid.NewGuid();

        await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "simulator", CancellationToken.None);
    }

    [SkippableFact]
    public async Task Concurrent_record_usage_converges_on_expected_spend()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 500m,
            HardCutoffUsdPerUtcMonth = 5000m,
            WarnFraction = 0.75m
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(1m);

        InMemoryLlmTenantBudgetRepository repo = new();
        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, repo);
        Guid tenant = Guid.NewGuid();
        IScopeContextProvider scope = CreateScopeProvider(tenant);

        Task[] tasks = new Task[32];

        for (int i = 0; i < tasks.Length; i++)
        {
            tasks[i] = tracker.RecordUsageAndMaybeWarnAsync(
                tenant, "azure-openai", scope, null, 1, 1, CancellationToken.None);
        }

        await Task.WhenAll(tasks);

        DateTime utc = TimeProvider.System.UtcNowDateTime();
        string periodKey = string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", utc.Year, utc.Month);
        LlmTenantBudgetStateReadModel row =
            await repo.GetOrCreateAsync(tenant, LlmBudgetPeriod.Monthly, periodKey, CancellationToken.None);

        row.CommittedUsd.Should().Be(32m);
    }

    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_respects_sql_backed_purchased_cap_bump()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 50m,
            HardCutoffUsdPerUtcMonth = 75m,
            AssumedMaxPromptTokensPerRequest = 1,
            AssumedMaxCompletionTokensPerRequest = 1
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(10m);

        InMemoryLlmTenantBudgetRepository repo = new();
        Guid tenant = Guid.NewGuid();
        DateTime utc = TimeProvider.System.UtcNowDateTime();
        string periodKey = string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", utc.Year, utc.Month);

        await repo.ApplyMonthlyPurchasedCapBumpAsync(tenant, periodKey, 50m, CancellationToken.None);

        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(monitor.Object, cost.Object, repo);
        IScopeContextProvider scopeProvider = CreateScopeProvider(tenant);

        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, null, 10, 10, CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scopeProvider, null, 10, 10, CancellationToken.None);

        await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);
    }

    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_when_simulate_flag_true_in_non_production_throws()
    {
        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            Enabled = true,
            IncludedUsdPerUtcMonth = 500m,
            HardCutoffUsdPerUtcMonth = 5000m,
            AssumedMaxPromptTokensPerRequest = 1,
            AssumedMaxCompletionTokensPerRequest = 1
        };

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>())).Returns(0.01m);

        Dictionary<string, string?> configValues = new()
        {
            ["ArchLucid:Testing:SimulateLlmBudgetExhausted"] = "true"
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(configValues!).Build();
        LlmMonthlyTenantDollarBudgetTracker tracker = CreateTracker(
            monitor.Object,
            cost.Object,
            new InMemoryLlmTenantBudgetRepository(),
            configuration,
            new NonProductionTestHostEnvironment());

        Guid tenant = Guid.NewGuid();

        Func<Task> act = async () =>
            await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);

        await act.Should().ThrowAsync<LlmTokenQuotaExceededException>()
            .WithMessage("*Simulated LLM budget exhaustion*");
    }

    private static LlmMonthlyTenantDollarBudgetTracker CreateTracker(
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> options,
        ILlmCostEstimator costEstimator,
        ILlmTenantBudgetRepository repository,
        IConfiguration? configuration = null,
        IHostEnvironment? hostEnvironment = null,
        TimeProvider? timeProvider = null)
    {
        IConfiguration effectiveConfiguration = configuration ?? new ConfigurationBuilder().Build();
        IHostEnvironment effectiveHostEnvironment = hostEnvironment ?? CreateNonProductionHostEnvironment();

        return new LlmMonthlyTenantDollarBudgetTracker(
            options,
            costEstimator,
            repository,
            new NoOpLlmTenantWalletService(),
            effectiveConfiguration,
            effectiveHostEnvironment,
            timeProvider ?? TimeProvider.System);
    }

    private static IHostEnvironment CreateNonProductionHostEnvironment() => new NonProductionTestHostEnvironment();

    private static IScopeContextProvider CreateScopeProvider(Guid tenantId)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        return scope.Object;
    }
}
