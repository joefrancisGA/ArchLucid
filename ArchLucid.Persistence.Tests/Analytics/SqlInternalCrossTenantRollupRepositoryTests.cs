using ArchLucid.Core.Analytics;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

using Polly;

namespace ArchLucid.Persistence.Tests.Analytics;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Core")]
public sealed class SqlInternalCrossTenantRollupRepositoryTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Failed_batch_preserves_the_previous_rollup()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        SqlInternalCrossTenantRollupRepository repository = new(
            new BackgroundWorkerResilientSqlConnectionFactory(connectionFactory, ResiliencePipeline.Empty),
            new SqlResilientOperationExecutor(ResiliencePipeline.Empty));

        DateOnly date = new(2026, 1, 1);
        string validKey = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        string invalidKey = validKey[..^1] + "z";
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);

        try
        {
            await repository.UpsertDailyRowsAsync([Row(validKey, 3)]);

            Func<Task> refresh = () => repository.UpsertDailyRowsAsync([Row(validKey, 9), Row(invalidKey, 1)]);
            (await refresh.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(547);

            IReadOnlyList<InternalCrossTenantRollupDailyRow> rows = await repository.ListDailyRowsAsync(date);
            rows.Should().ContainSingle(row => row.AnalyticsTenantKey == validKey)
                .Which.TotalRunsNonArchived.Should().Be(3);
        }
        finally
        {
            await connection.ExecuteAsync(
                "DELETE FROM dbo.InternalCrossTenantRollupDaily WHERE RollupDate = @Date AND AnalyticsTenantKey IN (@ValidKey, @InvalidKey)",
                new { Date = date, ValidKey = validKey, InvalidKey = invalidKey });
        }

        InternalCrossTenantRollupDailyRow Row(string key, long runs) => new()
        {
            RollupDate = date,
            AnalyticsTenantKey = key,
            TotalRunsNonArchived = runs,
            ComputedUtc = DateTimeOffset.UnixEpoch,
        };
    }
}
