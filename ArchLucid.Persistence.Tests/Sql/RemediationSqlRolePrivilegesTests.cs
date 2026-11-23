using System.Text.RegularExpressions;

using ArchLucid.Persistence.InfraEvidence;

using Dapper;
using FluentAssertions;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
/// Disposable SQL Server proof that the actual migration denies remediation
/// evidence edits/deletes and instance deletes to the application role, even
/// when that principal also has db_datawriter rights.
/// It intentionally does not claim direct instance UPDATE has been revoked.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class RemediationSqlRolePrivilegesTests(SqlServerPersistenceFixture fixture)
{
    private const string RoleName = "ArchLucidApp";

    [SkippableFact]
    public async Task Role_denies_evidence_rewrite_and_direct_delete_but_preserves_required_instance_update()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable,
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionStringBuilder builder = new(fixture.ConnectionString);
        builder.InitialCatalog.Should().Contain("Test",
            "this test creates roles and must never target a customer catalog");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        // Migration 426 follows the existing [ArchLucidApp] convention, which
        // may not exist when this disposable fixture first runs DbUp.
        await connection.ExecuteAsync(
            """
            IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NULL
                CREATE ROLE [ArchLucidApp];
            IF DATABASE_PRINCIPAL_ID(N'ArchLucidAppRemediationPermissionsTest') IS NULL
                CREATE USER [ArchLucidAppRemediationPermissionsTest] WITHOUT LOGIN;
            IF NOT EXISTS (
                SELECT 1 FROM sys.database_role_members rm
                JOIN sys.database_principals member ON member.principal_id = rm.member_principal_id
                JOIN sys.database_principals role ON role.principal_id = rm.role_principal_id
                WHERE member.name = N'ArchLucidAppRemediationPermissionsTest'
                  AND role.name = N'ArchLucidApp')
                ALTER ROLE [ArchLucidApp] ADD MEMBER [ArchLucidAppRemediationPermissionsTest];
            IF NOT EXISTS (
                SELECT 1 FROM sys.database_role_members rm
                JOIN sys.database_principals member ON member.principal_id = rm.member_principal_id
                JOIN sys.database_principals role ON role.principal_id = rm.role_principal_id
                WHERE member.name = N'ArchLucidAppRemediationPermissionsTest'
                  AND role.name = N'db_datawriter')
                ALTER ROLE [db_datawriter] ADD MEMBER [ArchLucidAppRemediationPermissionsTest];
            """);

        // Reapply the *actual embedded* DbUp migration after creating the
        // disposable role. Its idempotent DENY statements must support both
        // existing roles and newly provisioned app identities.
        string resource = typeof(SqlRemediationInstanceRepository).Assembly
            .GetManifestResourceNames()
            .Single(name => name.EndsWith(
                ".Migrations.426_RemediationRoleWritePermissions.sql",
                StringComparison.Ordinal));
        await using Stream migrationStream = typeof(SqlRemediationInstanceRepository).Assembly
            .GetManifestResourceStream(resource)!;
        using StreamReader reader = new(migrationStream);
        string migrationSql = await reader.ReadToEndAsync();
        foreach (string batch in Regex.Split(migrationSql, @"(?im)^\s*GO\s*$"))
        {
            if (!string.IsNullOrWhiteSpace(batch))
                await connection.ExecuteAsync(batch);
        }

        foreach ((string table, string permission) in new[]
                 {
                     ("dbo.RemediationEvidence", "UPDATE"),
                     ("dbo.RemediationEvidence", "DELETE"),
                     ("dbo.RemediationInstances", "DELETE"),
                 })
        {
            int deny = await connection.QuerySingleAsync<int>(
                """
                SELECT COUNT(1)
                FROM sys.database_permissions p
                JOIN sys.database_principals r ON p.grantee_principal_id = r.principal_id
                WHERE p.major_id = OBJECT_ID(@TableName)
                  AND p.class_desc = N'OBJECT_OR_COLUMN'
                  AND p.permission_name = @Permission
                  AND p.state_desc = N'DENY'
                  AND r.name = @RoleName;
                """,
                new { TableName = table, Permission = permission, RoleName });
            deny.Should().Be(1, $"{table} requires a role-level DENY {permission}");
        }

        await connection.ExecuteAsync(
            "EXECUTE AS USER = 'ArchLucidAppRemediationPermissionsTest';");
        try
        {
            foreach ((string table, string permission) in new[]
                     {
                         ("dbo.RemediationEvidence", "UPDATE"),
                         ("dbo.RemediationEvidence", "DELETE"),
                         ("dbo.RemediationInstances", "DELETE"),
                     })
            {
                int effective = await connection.QuerySingleAsync<int>(
                    """
                    SELECT ISNULL(HAS_PERMS_BY_NAME(@TableName, N'OBJECT', @Permission), 0);
                    """,
                    new { TableName = table, Permission = permission });
                effective.Should().Be(0,
                    $"DENY {permission} on {table} must override db_datawriter");
            }

            Func<Task> alterEvidence = () => connection.ExecuteAsync(
                "UPDATE dbo.RemediationEvidence SET PayloadJson = N'{}' WHERE 1 = 0;");
            Func<Task> deleteEvidence = () => connection.ExecuteAsync(
                "DELETE FROM dbo.RemediationEvidence WHERE 1 = 0;");
            Func<Task> deleteInstance = () => connection.ExecuteAsync(
                "DELETE FROM dbo.RemediationInstances WHERE 1 = 0;");

            (await alterEvidence.Should().ThrowAsync<SqlException>()).Which
                .Number.Should().Be(229);
            (await deleteEvidence.Should().ThrowAsync<SqlException>()).Which
                .Number.Should().Be(229);
            (await deleteInstance.Should().ThrowAsync<SqlException>()).Which
                .Number.Should().Be(229);

            int instanceUpdate = await connection.QuerySingleAsync<int>(
                """
                SELECT ISNULL(HAS_PERMS_BY_NAME(
                    N'dbo.RemediationInstances', N'OBJECT', N'UPDATE'), 0);
                """);
            instanceUpdate.Should().Be(1,
                "the existing rowversion-protected repository still requires UPDATE");
            int evidenceInsert = await connection.QuerySingleAsync<int>(
                """
                SELECT ISNULL(HAS_PERMS_BY_NAME(
                    N'dbo.RemediationEvidence', N'OBJECT', N'INSERT'), 0);
                """);
            evidenceInsert.Should().Be(1,
                "approval and verification evidence remains appendable");

            // Permission checks are against a zero-row predicate. This
            // establishes access posture without mutating fixture records.
            (await connection.ExecuteAsync(
                "UPDATE dbo.RemediationInstances SET UpdatedUtc = UpdatedUtc WHERE 1 = 0;"))
                .Should().Be(0);
        }
        finally
        {
            await connection.ExecuteAsync("REVERT;");
        }
    }
}
