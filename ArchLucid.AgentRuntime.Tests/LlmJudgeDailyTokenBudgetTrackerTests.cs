using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class LlmJudgeDailyTokenBudgetTrackerTests
{
    [Fact]
    public async Task TryPeekWithinBudgetAsync_returns_false_when_cap_would_be_exceeded()
    {
        Guid tenant = Guid.NewGuid();
        InMemoryLlmTenantBudgetRepository repo = new();
        string periodKey = TimeProvider.System.UtcToday().ToString("yyyy-MM-dd");

        LlmTenantBudgetStateReadModel row =
            await repo.GetOrCreateAsync(tenant, LlmBudgetPeriod.JudgeDaily, periodKey, CancellationToken.None);

        await repo.SettleAsync(
            new LlmTenantBudgetSettleRequest
            {
                TenantId = tenant,
                Period = LlmBudgetPeriod.JudgeDaily,
                PeriodKey = periodKey,
                ActualTokens = 199_000L,
                ReleaseReservedTokens = 0L,
                WarnAtTokens = long.MaxValue,
                ExpectedRowVersion = row.RowVersion
            },
            CancellationToken.None);

        LlmJudgeDailyTokenBudgetTracker tracker = CreateTracker(
            repo,
            hardCap: 200_000,
            assumed: 4096);

        bool within = await tracker.TryPeekWithinBudgetAsync(tenant, CancellationToken.None);

        within.Should().BeFalse();
    }

    [Fact]
    public void RecordBudgetExhausted_does_not_throw()
    {
        LlmJudgeDailyTokenBudgetTracker tracker = CreateTracker();

        Action act = () => tracker.RecordBudgetExhausted();

        act.Should().NotThrow();
    }

    private static LlmJudgeDailyTokenBudgetTracker CreateTracker(
        InMemoryLlmTenantBudgetRepository? repo = null,
        long hardCap = 200_000,
        int assumed = 8192)
    {
        Mock<IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions>> opts = new();
        opts.Setup(o => o.CurrentValue)
            .Returns(new LlmJudgeDailyTokenBudgetOptions
            {
                Enabled = true,
                HardCutoffTokensPerUtcDay = hardCap,
                AssumedMaxTotalTokensPerRequest = assumed
            });

        InMemoryLlmTenantBudgetRepository budgetRepo = repo ?? new InMemoryLlmTenantBudgetRepository();

        return new LlmJudgeDailyTokenBudgetTracker(opts.Object, budgetRepo);
    }
}
