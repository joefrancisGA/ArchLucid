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

        long? reserved = await tracker.EnsureWithinBudgetBeforeCallAsync(tenant, "azure-openai", CancellationToken.None);
        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            null, 100, 100, 0, reserved, CancellationToken.None);
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
            null, 400, 0, 0, null, CancellationToken.None);

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
            audit.Object, 700, 0, 0, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);

        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            audit.Object, 150, 0, 0, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.LlmTenantDailyBudgetApproaching),
                It.IsAny<CancellationToken>()),
            Times.Once);

        await tracker.RecordUsageAndMaybeWarnAsync(
            tenant,
            "azure-openai",
            CreateScopeProvider(tenant),
            audit.Object, 10, 0, 0, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.LlmTenantDailyBudgetApproaching),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task Concurrent_record_usage_retries_a_real_stale_version_and_preserves_both_updates()
    {
        LlmDailyTenantTokenWindowOptions opts = new()
        {
            Enabled = true,
            HardCutoffTokensPerUtcDay = 500_000,
            WarnFraction = 0.8m
        };

        Mock<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(opts);

        const string fixedPeriodKey = "2026-10-22";
        Guid tenant = Guid.NewGuid();
        InMemoryLlmTenantBudgetRepository store = new();
        Mock<ILlmTenantBudgetRepository> repo = new(MockBehavior.Strict);
        TaskCompletionSource bothSettling = new(TaskCreationOptions.RunContinuationsAsynchronously);
        int settleAttempts = 0;
        int conflicts = 0;

        // Pin the backing row so the optimistic-concurrency check is independent of UTC midnight.
        repo.Setup(r => r.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((Guid id, LlmBudgetPeriod period, string _, CancellationToken ct) =>
                store.GetOrCreateAsync(id, period, fixedPeriodKey, ct));
        repo.Setup(r => r.SettleAsync(It.IsAny<LlmTenantBudgetSettleRequest>(), It.IsAny<CancellationToken>()))
            .Returns(async (LlmTenantBudgetSettleRequest request, CancellationToken ct) =>
            {
                int attempt = Interlocked.Increment(ref settleAttempts);
                if (attempt == 2)
                    bothSettling.TrySetResult();
                if (attempt <= 2)
                    await bothSettling.Task.WaitAsync(ct);

                LlmTenantBudgetSettleResult result = await store.SettleAsync(new LlmTenantBudgetSettleRequest
                {
                    TenantId = request.TenantId,
                    Period = request.Period,
                    PeriodKey = fixedPeriodKey,
                    ActualTokens = request.ActualTokens,
                    ReleaseReservedTokens = request.ReleaseReservedTokens,
                    WarnAtTokens = request.WarnAtTokens,
                    ExpectedRowVersion = request.ExpectedRowVersion,
                }, ct);
                if (result.ConcurrencyConflict)
                    Interlocked.Increment(ref conflicts);

                return result;
            });

        LlmDailyTenantBudgetTracker tracker = new(monitor.Object, repo.Object);
        IScopeContextProvider scope = CreateScopeProvider(tenant);
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(10));

        await Task.WhenAll(
            tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scope, null, 1, 1, 0, null, timeout.Token),
            tracker.RecordUsageAndMaybeWarnAsync(tenant, "azure-openai", scope, null, 1, 1, 0, null, timeout.Token))
            .WaitAsync(timeout.Token);
        LlmTenantBudgetStateReadModel row =
            await store.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, fixedPeriodKey, timeout.Token);

        conflicts.Should().Be(1);
        settleAttempts.Should().Be(3);
        row.TokensConsumed.Should().Be(4L);
    }

    private static IScopeContextProvider CreateScopeProvider(Guid tenantId)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        return scope.Object;
    }
}
