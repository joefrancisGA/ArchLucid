using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Connections;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Analytics;

[Trait("Category", "Unit")]
public sealed class InternalCrossTenantSqlMetricsQueriesTests
{
    [Fact]
    public void RowLevelSecurityBypassSql_uses_read_only_session_context_flag()
    {
        InternalCrossTenantSqlMetricsQueries.RowLevelSecurityBypassSql
            .Should()
            .Contain("@read_only = 1", because: "RLS bypass must be immutable for the connection session lifetime.");
    }
}

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class InternalCrossTenantSqlMetricsQueriesSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ApplyRowLevelSecurityBypassAsync_second_set_on_same_connection_raises_read_only_error()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        await InternalCrossTenantSqlMetricsQueries.ApplyRowLevelSecurityBypassAsync(connection, CancellationToken.None);

        await using SqlCommand secondAttempt = connection.CreateCommand();
        secondAttempt.CommandText =
            "EXEC sys.sp_set_session_context @key = N'al_rls_bypass', @value = 0, @read_only = 0;";

        Func<Task> act = () => secondAttempt.ExecuteNonQueryAsync(CancellationToken.None);

        SqlException exception = (await act.Should().ThrowAsync<SqlException>()).Which;
        exception.Number.Should().Be(15665);
    }
}
