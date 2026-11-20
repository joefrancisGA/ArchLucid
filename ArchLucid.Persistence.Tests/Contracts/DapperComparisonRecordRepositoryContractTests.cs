using System.Data;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="ComparisonRecordRepositoryContractTests" /> against <see cref="ComparisonRecordRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperComparisonRecordRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : ComparisonRecordRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override async Task BeforeSqlComparisonRecordPersistAsync(ComparisonRecord row, CancellationToken ct)
    {
        SkipIfSqlServerUnavailable();

        await using SqlConnection conn = new(fixture.ConnectionString);
        await conn.OpenAsync(ct);
        await ComparisonRecordContractTestSqlSeed.EnsureRunsForComparisonRecordAsync(conn, row, ct);
    }

    [SkippableFact]
    public async Task SearchAsync_applies_inclusive_date_bounds_at_stored_precision()
    {
        SkipIfSqlServerUnavailable();
        CancellationToken ct = CancellationToken.None;
        string type = "precision-" + Guid.NewGuid().ToString("N");
        DateTime midnight = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime from = midnight.AddTicks(12_345);
        DateTime to = midnight.AddTicks(18_765);
        string fromId = "cmp-" + Guid.NewGuid().ToString("N");
        string toId = "cmp-" + Guid.NewGuid().ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(ct);
        await using SqlCommand insert = connection.CreateCommand();
        insert.CommandText = """
            INSERT INTO dbo.ComparisonRecords (ComparisonRecordId, ComparisonType, Format, PayloadJson, CreatedUtc)
            VALUES (@Id, @Type, N'json', N'{}', @CreatedUtc);
            """;
        SqlParameter idParameter = insert.Parameters.Add("@Id", SqlDbType.NVarChar, 64);
        insert.Parameters.Add("@Type", SqlDbType.NVarChar, 100).Value = type;
        SqlParameter timeParameter = insert.Parameters.Add("@CreatedUtc", SqlDbType.DateTime2);

        foreach ((string id, DateTime createdUtc) in new[]
                 {
                     ("cmp-" + Guid.NewGuid().ToString("N"), from.AddTicks(-1)),
                     (fromId, from),
                     (toId, to),
                     ("cmp-" + Guid.NewGuid().ToString("N"), to.AddTicks(1)),
                 })
        {
            idParameter.Value = id;
            timeParameter.Value = createdUtc;
            await insert.ExecuteNonQueryAsync(ct);
        }

        IReadOnlyList<ComparisonRecord> rows = await CreateRepository().SearchAsync(
            type, null, null, from, to, null, null, null, null, "createdUtc", "asc", 0, 10, ct);

        Assert.Equal(new[] { fromId, toId }, rows.Select(row => row.ComparisonRecordId));
    }

    protected override IComparisonRecordRepository CreateRepository()
    {
        TestSqlDbConnectionFactory write = new(fixture.ConnectionString);
        return new ComparisonRecordRepository(write, new TestReadOnlyDbConnectionFactory(write));
    }
}
