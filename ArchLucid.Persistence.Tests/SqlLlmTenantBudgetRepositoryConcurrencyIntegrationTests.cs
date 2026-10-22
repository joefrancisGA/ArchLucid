using System.Globalization;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Two parallel <see cref="SqlLlmTenantBudgetRepository.ReserveAsync" /> callers against one SQL row (INV-004).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SqlLlmTenantBudgetRepositoryConcurrencyIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Concurrent_daily_reserve_serializes_on_hard_cap()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlLlmTenantBudgetRepository sut = new(new TestSqlDbConnectionFactory(fixture.ConnectionString));
        Guid tenant = Guid.NewGuid();
        DateOnly day = DateOnly.FromDateTime(DateTime.UtcNow);
        string periodKey = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        int reserveSuccess = 0;
        int hardCapHits = 0;

        await Task.WhenAll(WorkerAsync(), WorkerAsync());

        reserveSuccess.Should().Be(1);
        hardCapHits.Should().Be(1);

        LlmTenantBudgetStateReadModel final =
            await sut.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, periodKey, CancellationToken.None);

        final.ReservedTokens.Should().Be(600);

        await SettleReleaseAsync(sut, tenant, periodKey);
        return;

        async Task WorkerAsync()
        {
            for (int i = 0; i < 40; i++)
            {
                LlmTenantBudgetStateReadModel read =
                    await sut.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, periodKey, CancellationToken.None);

                LlmTenantBudgetReserveResult r = await sut.ReserveAsync(
                    new LlmTenantBudgetReserveRequest
                    {
                        TenantId = tenant,
                        Period = LlmBudgetPeriod.Daily,
                        PeriodKey = periodKey,
                        ReserveTokens = 600,
                        HardCapTokens = 1000,
                        ExpectedRowVersion = read.RowVersion
                    },
                    CancellationToken.None);

                if (r.ConcurrencyConflict)
                {
                    await Task.Delay(3, CancellationToken.None);

                    continue;
                }

                if (r.HardCapBlocked)
                {
                    Interlocked.Increment(ref hardCapHits);

                    return;
                }

                Interlocked.Increment(ref reserveSuccess);

                return;
            }
        }
    }

    private static async Task SettleReleaseAsync(
        SqlLlmTenantBudgetRepository sut,
        Guid tenant,
        string periodKey)
    {
        for (int i = 0; i < 12; i++)
        {
            LlmTenantBudgetStateReadModel read =
                await sut.GetOrCreateAsync(tenant, LlmBudgetPeriod.Daily, periodKey, CancellationToken.None);

            if (read.ReservedTokens < 1)
                return;

            LlmTenantBudgetSettleResult s = await sut.SettleAsync(
                new LlmTenantBudgetSettleRequest
                {
                    TenantId = tenant,
                    Period = LlmBudgetPeriod.Daily,
                    PeriodKey = periodKey,
                    ActualTokens = 0L,
                    ReleaseReservedTokens = read.ReservedTokens,
                    WarnAtTokens = long.MaxValue,
                    ExpectedRowVersion = read.RowVersion
                },
                CancellationToken.None);

            if (!s.ConcurrencyConflict)
                return;
        }
    }
}
