using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>TB-006: FK from <c>dbo.ComparisonRecords</c> to <c>dbo.Runs</c> rejects non-existent run GUIDs.</summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "SqlServer")]
public sealed class ComparisonRecordRunForeignKeySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task CreateAsync_nonexistent_left_run_guid_throws_sql_exception()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        ComparisonRecordRepository repo = new(new TestSqlDbConnectionFactory(fixture.ConnectionString));
        Guid missingRun = Guid.NewGuid();
        ComparisonRecord row = new()
        {
            ComparisonRecordId = "cmp_fk_" + Guid.NewGuid().ToString("N"),
            ComparisonType = "end-to-end-replay",
            LeftRunId = missingRun.ToString("N"),
            RightRunId = null,
            Format = "json",
            PayloadJson = "{}",
            CreatedUtc = DateTime.UtcNow
        };

        Func<Task> act = async () => await repo.CreateAsync(row, CancellationToken.None);

        await act.Should().ThrowAsync<SqlException>();
    }
}
