using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions.Specialized;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>INV-002: <c>dbo.Runs.StructuralExecutionMode</c> rejects explicit NULL inserts.</summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "SqlServer")]
public sealed class RunsStructuralExecutionModeNullSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantId = Guid.Parse("71717171-7171-7171-7171-717171717171");

    private static readonly Guid WorkspaceId = Guid.Parse("72727272-7272-7272-7272-727272727272");

    private static readonly Guid ProjectId = Guid.Parse("73737373-7373-7373-7373-737373737373");

    [SkippableFact]
    public async Task Insert_run_with_explicit_null_structural_execution_mode_fails()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();

        int columnPresent = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                """
                SELECT COUNT(1)
                FROM sys.columns
                WHERE object_id = OBJECT_ID(N'dbo.Runs')
                  AND name = N'StructuralExecutionMode';
                """,
                cancellationToken: CancellationToken.None));

        Skip.If(columnPresent == 0, "Catalog does not yet define dbo.Runs.StructuralExecutionMode.");

        await AuthorityRunChainTestSeed.InsertRunAsync(connection, TenantId, WorkspaceId, ProjectId, runId, "null-mode-test", CancellationToken.None);

        const string poisonNull = """
                                  UPDATE dbo.Runs
                                  SET StructuralExecutionMode = NULL
                                  WHERE RunId = @RunId;
                                  """;

        Func<Task> act = async () =>
            await connection.ExecuteAsync(new CommandDefinition(poisonNull, new { RunId = runId }, cancellationToken: CancellationToken.None));

        ExceptionAssertions<SqlException> assertion = await act.Should().ThrowAsync<SqlException>();

        assertion.Which.Number.Should().Be(515, "SET to NULL on NOT NULL column should fail as 515 on SQL Server.");
    }
}
