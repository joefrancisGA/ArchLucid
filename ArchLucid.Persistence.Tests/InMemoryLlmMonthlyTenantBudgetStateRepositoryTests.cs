using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Data.Repositories.LlmMonthlyTenantBudget;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class InMemoryLlmMonthlyTenantBudgetStateRepositoryTests
{
    [Fact]
    public async Task Parallel_increments_sum_under_contention()
    {
        InMemoryLlmMonthlyTenantBudgetStateRepository sut = new();
        Guid tenant = Guid.NewGuid();
        int year = 2026;
        int month = 5;
        decimal warnAt = 10_000m;

        Task[] workers = new Task[20];

        for (int w = 0; w < workers.Length; w++)
            workers[w] = AddTenUsdAsync(sut, tenant, year, month, warnAt);

        await Task.WhenAll(workers);

        LlmMonthlyTenantBudgetStateReadModel final = await sut.GetOrCreateAsync(tenant, year, month, CancellationToken.None);

        final.SpentUsd.Should().Be(200m);
    }

    private static async Task AddTenUsdAsync(
        InMemoryLlmMonthlyTenantBudgetStateRepository sut,
        Guid tenant,
        int year,
        int month,
        decimal warnAt)
    {
        int completed = 0;

        LlmMonthlyTenantBudgetStateReadModel read =
            await sut.GetOrCreateAsync(tenant, year, month, CancellationToken.None);

        byte[] rowVersion = read.RowVersion;

        while (completed < 10)
        {
            LlmMonthlyTenantBudgetSpendUpdateResult result = await sut
                .TryIncrementSpendAsync(tenant, year, month, 1m, warnAt, rowVersion, CancellationToken.None)
                .ConfigureAwait(false);

            if (result.ConcurrencyConflict)
            {
                read = await sut.GetOrCreateAsync(tenant, year, month, CancellationToken.None).ConfigureAwait(false);
                rowVersion = read.RowVersion;

                continue;
            }

            completed++;
            rowVersion = result.NewState!.RowVersion;
        }
    }
}
