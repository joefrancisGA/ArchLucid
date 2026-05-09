using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Data.Repositories.LlmDailyTenantTokenWindow;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class InMemoryLlmDailyTenantTokenWindowStateRepositoryTests
{
    [Fact]
    public async Task Parallel_increments_sum_under_contention()
    {
        InMemoryLlmDailyTenantTokenWindowStateRepository sut = new();
        Guid tenant = Guid.NewGuid();
        DateOnly day = new(2026, 5, 8);
        long warnAt = 10_000;

        Task[] workers = new Task[20];

        for (int w = 0; w < workers.Length; w++)
            workers[w] = AddTenTokensAsync(sut, tenant, day, warnAt);

        await Task.WhenAll(workers);

        LlmDailyTenantTokenWindowStateReadModel final = await sut.GetOrCreateAsync(tenant, day, CancellationToken.None);

        final.TotalTokens.Should().Be(200L);
    }

    private static async Task AddTenTokensAsync(
        InMemoryLlmDailyTenantTokenWindowStateRepository sut,
        Guid tenant,
        DateOnly day,
        long warnAt)
    {
        int completed = 0;

        LlmDailyTenantTokenWindowStateReadModel read =
            await sut.GetOrCreateAsync(tenant, day, CancellationToken.None);

        byte[] rowVersion = read.RowVersion;

        while (completed < 10)
        {
            LlmDailyTenantTokenWindowTokensUpdateResult result = await sut
                .TryIncrementTokensAsync(tenant, day, 1, warnAt, rowVersion, CancellationToken.None)
                .ConfigureAwait(false);

            if (result.ConcurrencyConflict)
            {
                read = await sut.GetOrCreateAsync(tenant, day, CancellationToken.None).ConfigureAwait(false);
                rowVersion = read.RowVersion;

                continue;
            }

            completed++;
            rowVersion = result.NewState!.RowVersion;
        }
    }
}
