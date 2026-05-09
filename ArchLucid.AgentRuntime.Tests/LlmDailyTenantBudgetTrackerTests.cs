using System.Globalization;

using ArchLucid.Core;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmDailyTenantBudgetTrackerTests
{
    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_when_under_limit_does_not_throw()
    {
        LlmDailyTenantTokenWindowOptions opts = new()
        {
            Enabled = true, HardCutoffTokensPerUtcDay = 10_000, AssumedMaxTotalTokensPerRequest = 512
        };

        Mock<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);

        InMemoryLlmTenantBudgetRepository repo = new();
        LlmDailyTenantBudgetTracker tracker = new(monitor.Object, repo);
        Guid tenant = Guid.NewGuid();

        await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            null,
            100,
            100,
            CancellationToken.None);
        await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);
    }

    [SkippableFact]
    public async Task EnsureWithinBudgetBeforeCall_when_would_exceed_throws()
    {
        LlmDailyTenantTokenWindowOptions opts = new()
        {
            Enabled = true, HardCutoffTokensPerUtcDay = 500, AssumedMaxTotalTokensPerRequest = 256
        };

        Mock<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);

        LlmDailyTenantBudgetTracker tracker = new(monitor.Object, new InMemoryLlmTenantBudgetRepository());
        Guid tenant = Guid.NewGuid();

        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            null,
            400,
            0,
            CancellationToken.None);

        Func<Task> act = async () =>
            await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);

        await act.Should().ThrowAsync<LlmTokenQuotaExceededException>();
    }

    [SkippableFact]
    public async Task RecordUsageAndMaybeWarn_warns_at_most_once_per_utc_day_when_threshold_crossed()
    {
        LlmDailyTenantTokenWindowOptions opts = new()
        {
            Enabled = true, HardCutoffTokensPerUtcDay = 1000, WarnFraction = 0.8m
        };

        Mock<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);

        LlmDailyTenantBudgetTracker tracker = new(monitor.Object, new InMemoryLlmTenantBudgetRepository());
        Guid tenant = Guid.NewGuid();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            audit.Object,
            700,
            0,
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);

        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            audit.Object,
            150,
            0,
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.LlmTenantDailyBudgetApproaching),
                It.IsAny<CancellationToken>()),
            Times.Once);

        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            audit.Object,
            10,
            0,
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.LlmTenantDailyBudgetApproaching),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task Concurrent_record_usage_converges_on_expected_tokens()
    {
        LlmDailyTenantTokenWindowOptions opts = new()
        {
            Enabled = true,
            HardCutoffTokensPerUtcDay = 500_000,
            WarnFraction = 0.8m
        };

        Mock<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);

        InMemoryLlmTenantBudgetRepository repo = new();
        LlmDailyTenantBudgetTracker tracker = new(monitor.Object, repo);
        Guid tenant = Guid.NewGuid();
        IScopeContextProvider scope = CreateScopeProvider(tenant);

        Task[] tasks = new Task[32];

        for (int i = 0; i < tasks.Length; i++)
        {
            tasks[i] = tracker.RecordUsageAndMaybeWarnAsync(
                tenant, "azure-openai", scope, null, 1, 1, CancellationToken.None);
        }

        await Task.WhenAll(tasks);

        DateOnly day = TimeProvider.System.UtcToday();
        string periodKey = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        LlmTenantBudgetStateReadModel row =
            await repo.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, periodKey, CancellationToken.None);

        row.TokensConsumed.Should().Be(64L);
    }

    private static IScopeContextProvider CreateScopeProvider(Guid tenantId)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        return scope.Object;
    }
}
