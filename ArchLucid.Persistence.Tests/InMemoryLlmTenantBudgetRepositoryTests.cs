using System.Globalization;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class InMemoryLlmTenantBudgetRepositoryTests
{
    [Fact]
    public async Task Parallel_daily_settles_sum_under_contention()
    {
        InMemoryLlmTenantBudgetRepository sut = new();
        Guid tenant = Guid.NewGuid();
        string periodKey = new DateOnly(2026, 5, 8).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        long warnAt = 10_000;

        Task[] workers = new Task[20];

        for (int w = 0; w < workers.Length; w++)
            workers[w] = AddTenTokensAsync(sut, tenant, periodKey, warnAt);

        await Task.WhenAll(workers);

        LlmTenantBudgetStateReadModel final =
            await sut.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, periodKey, CancellationToken.None);

        final.TokensConsumed.Should().Be(200L);
    }

    private static async Task AddTenTokensAsync(
        InMemoryLlmTenantBudgetRepository sut,
        Guid tenant,
        string periodKey,
        long warnAt)
    {
        int completed = 0;

        LlmTenantBudgetStateReadModel read =
            await sut.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, periodKey, CancellationToken.None);

        byte[] rowVersion = read.RowVersion;

        while (completed < 10)
        {
            LlmTenantBudgetSettleResult result = await sut
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = tenant,
                        Period = LlmBudgetPeriod.Daily,
                        PeriodKey = periodKey,
                        ActualTokens = 1,
                        ReleaseReservedTokens = 0L,
                        WarnAtTokens = warnAt,
                        ExpectedRowVersion = rowVersion
                    },
                    CancellationToken.None)
                .ConfigureAwait(false);

            if (result.ConcurrencyConflict)
            {
                read = await sut.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, periodKey, CancellationToken.None)
                    .ConfigureAwait(false);
                rowVersion = read.RowVersion;

                continue;
            }

            completed++;
            rowVersion = result.NewState!.RowVersion;
        }
    }
}
