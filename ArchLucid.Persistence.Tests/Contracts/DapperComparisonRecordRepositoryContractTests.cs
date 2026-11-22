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

    [SkippableFact]
    public async Task Capped_lookups_use_comparison_id_to_break_created_time_ties()
    {
        SkipIfSqlServerUnavailable();
        CancellationToken ct = CancellationToken.None;
        Guid runId = Guid.NewGuid();
        string exportRecordId = Guid.NewGuid().ToString("N");
        string prefix = "cmp-ties-" + Guid.NewGuid().ToString("N");
        await BeforeSqlComparisonRecordPersistAsync(new ComparisonRecord
        {
            ComparisonRecordId = prefix,
            LeftRunId = runId.ToString("N"),
        }, ct);

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(ct);
        await using SqlCommand insert = connection.CreateCommand();
        insert.CommandText = """
            WITH Numbers AS (
                SELECT 0 AS Number
                UNION ALL
                SELECT Number + 1 FROM Numbers WHERE Number < 200
            )
            INSERT INTO dbo.ComparisonRecords
                (ComparisonRecordId, ComparisonType, LeftRunId, LeftExportRecordId, Format, PayloadJson, CreatedUtc)
            SELECT @Prefix + RIGHT('000' + CONVERT(varchar(3), Number), 3),
                   N'comparison-lookup-tie', @RunId, @ExportRecordId, N'json', N'{}', @CreatedUtc
            FROM Numbers
            OPTION (MAXRECURSION 201);
            """;
        insert.Parameters.Add("@Prefix", SqlDbType.NVarChar, 64).Value = prefix;
        insert.Parameters.Add("@RunId", SqlDbType.UniqueIdentifier).Value = runId;
        insert.Parameters.Add("@ExportRecordId", SqlDbType.NVarChar, 64).Value = exportRecordId;
        insert.Parameters.Add("@CreatedUtc", SqlDbType.DateTime2).Value =
            new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);
        await insert.ExecuteNonQueryAsync(ct);

        IComparisonRecordRepository repository = CreateRepository();
        string[] expected = Enumerable.Range(1, 200).Reverse().Select(i => $"{prefix}{i:D3}").ToArray();

        IReadOnlyList<ComparisonRecord> runMatches = await repository.GetByRunIdAsync(runId.ToString("N"), ct);
        Assert.Equal(expected, runMatches.Select(row => row.ComparisonRecordId));
        IReadOnlyList<ComparisonRecord> exportMatches = await repository.GetByExportRecordIdAsync(exportRecordId, ct);
        Assert.Equal(expected, exportMatches.Select(row => row.ComparisonRecordId));
    }

    protected override IComparisonRecordRepository CreateRepository()
    {
        TestSqlDbConnectionFactory write = new(fixture.ConnectionString);
        return new ComparisonRecordRepository(write, new TestReadOnlyDbConnectionFactory(write));
    }
}
