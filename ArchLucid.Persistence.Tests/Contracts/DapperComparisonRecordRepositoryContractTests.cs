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
    private readonly SqlServerPersistenceFixture _fixture = fixture;

    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override async Task BeforeSqlComparisonRecordPersistAsync(ComparisonRecord row, CancellationToken ct)
    {
        SkipIfSqlServerUnavailable();

        await using SqlConnection conn = new(_fixture.ConnectionString);
        await conn.OpenAsync(ct);
        await ComparisonRecordContractTestSqlSeed.EnsureRunsForComparisonRecordAsync(conn, row, ct);
    }

    protected override IComparisonRecordRepository CreateRepository()
    {
        return new ComparisonRecordRepository(new TestSqlDbConnectionFactory(fixture.ConnectionString));
    }
}
