using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Repositories;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     TB-303: SQL DENY UPDATE/DELETE on commit-sealed evidence tables for <c>[ArchLucidApp]</c>.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SealedEvidenceImmutabilitySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private const string AppRoleName = "ArchLucidApp";
    private const string AppRoleTestUserName = "ArchLucidAppSealedEvidenceTest";

    [SkippableFact]
    public async Task Sealed_tables_have_deny_update_delete_for_archlucidapp()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        await EnsureArchLucidAppRoleAsync(CancellationToken.None);

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        List<string> missingDeny = [];

        foreach (string tableName in SealedEvidenceTableRegistry.SealedTableNames)
        {
            bool exists = await TableExistsAsync(connection, tableName);

            if (!exists)
                continue;

            bool denyUpdate = await HasDenyPermissionAsync(connection, tableName, "UPDATE");
            bool denyDelete = await HasDenyPermissionAsync(connection, tableName, "DELETE");

            if (!denyUpdate)
                missingDeny.Add($"UPDATE on {tableName}");

            if (!denyDelete)
                missingDeny.Add($"DELETE on {tableName}");
        }

        missingDeny.Should().BeEmpty("migration 247 must DENY UPDATE/DELETE for [ArchLucidApp] on existing sealed tables");
    }

    [SkippableFact]
    public async Task AgentResults_update_denied_for_archlucidapp_member_user()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        await EnsureArchLucidAppRoleAsync(CancellationToken.None);

        string resultId = "sealed-evidence-test-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "sealed-evidence-req-" + Guid.NewGuid().ToString("N");

        await using (SqlConnection setup = new(fixture.ConnectionString))
        {
            await setup.OpenAsync();

            if (!await TableExistsAsync(setup, "dbo.AgentResults"))
                Skip.If(true, "dbo.AgentResults not present in this catalog.");

            await Support.ArchitectureCommitTestSeed.InsertRequestAndRunAsync(setup, requestId, runId, CancellationToken.None);
            await Support.ArchitectureCommitTestSeed.InsertAgentTaskAsync(
                setup,
                new ArchLucid.Contracts.Agents.AgentTask { TaskId = "sealed-evidence-task", RunId = runId },
                CancellationToken.None);

            const string insertSql = """
                                     INSERT INTO dbo.AgentResults (ResultId, TaskId, RunId, AgentType, Confidence, ResultJson, CreatedUtc)
                                     VALUES (@ResultId, @TaskId, @RunId, N'Analyzer', 1.0, N'{}', SYSUTCDATETIME());
                                     """;

            await setup.ExecuteAsync(
                insertSql,
                new { ResultId = resultId, TaskId = "sealed-evidence-task", RunId = Guid.Parse(runId) });
        }

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        Func<Task> act = async () =>
        {
            await connection.ExecuteAsync($"EXECUTE AS USER = [{AppRoleTestUserName}];");
            try
            {
                await connection.ExecuteAsync(
                    "UPDATE dbo.AgentResults SET ResultJson = N'{\"mutated\":true}' WHERE ResultId = @ResultId;",
                    new { ResultId = resultId });
            }
            finally
            {
                await connection.ExecuteAsync("REVERT;");
            }
        };

        await act.Should().ThrowAsync<SqlException>();
    }

    [SkippableFact]
    public async Task AgentResultEnrichments_allows_post_commit_upsert_without_mutating_base_row()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string resultId = "enrichment-test-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "enrichment-req-" + Guid.NewGuid().ToString("N");

        TestSqlDbConnectionFactory connectionFactory = new(fixture.ConnectionString);
        AgentResultEnrichmentRepository enrichmentRepository = new(connectionFactory);

        await using (SqlConnection setup = new(fixture.ConnectionString))
        {
            await setup.OpenAsync();
            await Support.ArchitectureCommitTestSeed.InsertRequestAndRunAsync(setup, requestId, runId, CancellationToken.None);
            await Support.ArchitectureCommitTestSeed.InsertAgentTaskAsync(
                setup,
                new ArchLucid.Contracts.Agents.AgentTask { TaskId = "enrichment-task", RunId = runId },
                CancellationToken.None);

            const string insertSql = """
                                     INSERT INTO dbo.AgentResults (ResultId, TaskId, RunId, AgentType, Confidence, ResultJson, CreatedUtc)
                                     VALUES (@ResultId, @TaskId, @RunId, N'Analyzer', 1.0, N'{"base":true}', SYSUTCDATETIME());
                                     """;

            await setup.ExecuteAsync(
                insertSql,
                new { ResultId = resultId, TaskId = "enrichment-task", RunId = Guid.Parse(runId) });
        }

        await enrichmentRepository.UpsertCalibratedConfidenceAsync(resultId, 0.42, CancellationToken.None);
        await enrichmentRepository.UpsertCalibratedConfidenceAsync(resultId, 0.88, CancellationToken.None);

        await using SqlConnection verify = new(fixture.ConnectionString);
        await verify.OpenAsync();

        string? baseJson = await verify.QuerySingleOrDefaultAsync<string>(
            "SELECT ResultJson FROM dbo.AgentResults WHERE ResultId = @ResultId;",
            new { ResultId = resultId });

        float? calibrated = await verify.QuerySingleOrDefaultAsync<float?>(
            "SELECT CalibratedConfidence FROM dbo.AgentResultEnrichments WHERE ResultId = @ResultId;",
            new { ResultId = resultId });

        baseJson.Should().Be("{\"base\":true}");
        calibrated.Should().BeApproximately(0.88f, 0.001f);
    }

    private async Task EnsureArchLucidAppRoleAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string ddl = """
                           IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NULL
                               CREATE ROLE [ArchLucidApp];

                           IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ArchLucidAppSealedEvidenceTest')
                           BEGIN
                               CREATE USER [ArchLucidAppSealedEvidenceTest] WITHOUT LOGIN;
                               ALTER ROLE [ArchLucidApp] ADD MEMBER [ArchLucidAppSealedEvidenceTest];
                           END
                           """;

        await connection.ExecuteAsync(new CommandDefinition(ddl, cancellationToken: cancellationToken));
    }

    private static async Task<bool> TableExistsAsync(SqlConnection connection, string twoPartName)
    {
        int exists = await connection.QuerySingleAsync<int>(
            "SELECT CASE WHEN OBJECT_ID(@TableName, N'U') IS NOT NULL THEN 1 ELSE 0 END;",
            new { TableName = twoPartName });

        return exists == 1;
    }

    private static async Task<bool> HasDenyPermissionAsync(SqlConnection connection, string tableName, string permission)
    {
        int exists = await connection.QuerySingleAsync<int>(
            """
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM sys.database_permissions AS dp
                INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
                WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
                  AND dp.major_id = OBJECT_ID(@TableName)
                  AND dp.permission_name = @Permission
                  AND dp.state_desc = N'DENY'
                  AND gp.name = @RoleName)
            THEN 1 ELSE 0 END;
            """,
            new { TableName = tableName, Permission = permission, RoleName = AppRoleName });

        return exists == 1;
    }
}
