using System.Reflection;
using System.Text.RegularExpressions;

using Dapper;
using FluentAssertions;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
/// Validates migration 426 as a runtime role member in a disposable SQL test
/// catalog, without relying on administrative db_owner permission outcomes.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class RemediationRoleWritePermissionsSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private const string AppRoleName = "ArchLucidApp";
    private const string ImpersonatedUserName = "ArchLucidAppRemediationPermissionsTest";

    [SkippableFact]
    public async Task App_role_denies_tampering_and_delete_but_preserves_required_instance_update()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable,
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionStringBuilder connectionBuilder = new(fixture.ConnectionString);
        connectionBuilder.InitialCatalog.Should().Contain("Test",
            "this test creates principals and changes permissions only in a disposable catalog");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        // DatabaseMigrator may already have journaled migration 426 before
        // [ArchLucidApp] was provisioned. Run its *actual* embedded script
        // after installing a test-only role and impersonation principal.
        await connection.ExecuteAsync(
            """
            IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NULL
                CREATE ROLE [ArchLucidApp];
            IF DATABASE_PRINCIPAL_ID(N'ArchLucidAppRemediationPermissionsTest') IS NULL
                CREATE USER [ArchLucidAppRemediationPermissionsTest] WITHOUT LOGIN;
            IF IS_ROLEMEMBER(N'ArchLucidApp', N'ArchLucidAppRemediationPermissionsTest') <> 1
                ALTER ROLE [ArchLucidApp] ADD MEMBER [ArchLucidAppRemediationPermissionsTest];
            IF IS_ROLEMEMBER(N'db_datawriter', N'ArchLucidAppRemediationPermissionsTest') <> 1
                ALTER ROLE [db_datawriter] ADD MEMBER [ArchLucidAppRemediationPermissionsTest];
            """);

        Assembly persistence = typeof(ArchLucid.Persistence.InfraEvidence.SqlRemediationInstanceRepository).Assembly;
        string resource = persistence.GetManifestResourceNames()
            .Single(name => name.EndsWith("426_RemediationRoleWritePermissions.sql", StringComparison.Ordinal));
        await using Stream stream = persistence.GetManifestResourceStream(resource)
            ?? throw new InvalidOperationException("Remediation role migration was not embedded.");
        using StreamReader reader = new(stream);
        string script = await reader.ReadToEndAsync();

        // Replaying the migration must be idempotent and must apply
        // the DENYs after a late-provisioned runtime application role.
        foreach (int replay in Enumerable.Range(0, 2))
        {
            foreach (string batch in Regex.Split(script, @"(?m)^[ \t]*GO[ \t]*(?:\r?\n|$)"))
            {
                if (!string.IsNullOrWhiteSpace(batch))
                    await connection.ExecuteAsync(batch);
            }
        }

        foreach ((string table, string permission) in new[]
        {
            ("dbo.RemediationEvidence", "UPDATE"),
            ("dbo.RemediationEvidence", "DELETE"),
            ("dbo.RemediationInstances", "DELETE"),
        })
        {
            int directDenies = await connection.QuerySingleAsync<int>(
                """
                SELECT COUNT(*)
                FROM sys.database_permissions AS p
                INNER JOIN sys.database_principals AS g
                    ON g.principal_id = p.grantee_principal_id
                WHERE p.class_desc = N'OBJECT_OR_COLUMN'
                  AND p.major_id = OBJECT_ID(@TableName)
                  AND p.permission_name = @PermissionName
                  AND p.state_desc = N'DENY'
                  AND g.name = @RoleName;
                """,
                new { TableName = table, PermissionName = permission, RoleName = AppRoleName });
            directDenies.Should().Be(1, $"the app role must deny {permission} on {table}");
        }

        await connection.ExecuteAsync("EXECUTE AS USER = [ArchLucidAppRemediationPermissionsTest];");
        try
        {
            int cannotEditEvidence = await EffectivePermissionAsync(
                "dbo.RemediationEvidence", "UPDATE");
            int cannotDeleteEvidence = await EffectivePermissionAsync(
                "dbo.RemediationEvidence", "DELETE");
            int cannotDeleteInstances = await EffectivePermissionAsync(
                "dbo.RemediationInstances", "DELETE");
            int mayUpdateInstances = await EffectivePermissionAsync(
                "dbo.RemediationInstances", "UPDATE");
            int mayInsertEvidence = await EffectivePermissionAsync(
                "dbo.RemediationEvidence", "INSERT");

            cannotEditEvidence.Should().Be(0);
            cannotDeleteEvidence.Should().Be(0);
            cannotDeleteInstances.Should().Be(0);
            mayUpdateInstances.Should().Be(1,
                "existing rowversion-checked repository transitions require table UPDATE");
            mayInsertEvidence.Should().Be(1,
                "existing approval and verification transactions must still append evidence");
        }
        finally
        {
            await connection.ExecuteAsync("REVERT;");
        }

        async Task<int> EffectivePermissionAsync(string table, string permission) =>
            await connection.QuerySingleAsync<int>(
                "SELECT CONVERT(int, HAS_PERMS_BY_NAME(@TableName, N'OBJECT', @PermissionName));",
                new { TableName = table, PermissionName = permission });
    }
}
