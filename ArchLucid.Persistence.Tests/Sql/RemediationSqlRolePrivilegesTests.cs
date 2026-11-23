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

            -- db_datawriter does not confer SELECT. Model the runtime's required
            -- read access on just these tables, for the disposable user only.
            GRANT SELECT ON dbo.RemediationInstances TO [ArchLucidAppRemediationPermissionsTest];
            GRANT SELECT ON dbo.RemediationEvidence TO [ArchLucidAppRemediationPermissionsTest];
            """);

        // Reapply the *actual embedded* DbUp migration after creating the
        // disposable role. Its idempotent DENY statements must support both
        // existing roles and newly provisioned app identities.
        foreach (int migrationNumber in new[] { 426, 427 })
        {
            string resource = typeof(SqlRemediationInstanceRepository).Assembly
                .GetManifestResourceNames()
                .Single(name => name.Contains($".Migrations.{migrationNumber}_", StringComparison.Ordinal)
                    && name.EndsWith(".sql", StringComparison.Ordinal));
            await using Stream migrationStream = typeof(SqlRemediationInstanceRepository).Assembly
                .GetManifestResourceStream(resource)!;
            using StreamReader reader = new(migrationStream);
            string migrationSql = await reader.ReadToEndAsync();
            // Repeat both real migrations after role provisioning to verify idempotence.
            foreach (int replay in Enumerable.Range(0, 2))
            {
                foreach (string batch in Regex.Split(migrationSql, @"(?im)^\s*GO\s*$"))
                {
                    if (!string.IsNullOrWhiteSpace(batch))
                        await connection.ExecuteAsync(batch);
                }
            }
        }

        foreach ((string table, string permission) in new[]
                 {
                     ("dbo.RemediationEvidence", "UPDATE"),
                     ("dbo.RemediationEvidence", "DELETE"),
                     ("dbo.RemediationInstances", "DELETE"),
                     ("dbo.RemediationInstances", "UPDATE"),
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

        // Seed a genuine synthetic row under the elevated fixture identity.
        // A successful guarded procedure call from the limited app role must
        // update this record despite the table-level DENY UPDATE.
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid findingId = Guid.NewGuid();
        Guid patternId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        Guid instanceId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;
        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.OperationalSecurityFindings
                (FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem,
                 SourceFindingId, Title, FirstObservedUtc, LastObservedUtc, Status,
                 PayloadHashSha256, CreatedUtc, UpdatedUtc)
            VALUES
                (@findingId, @tenantId, @workspaceId, @projectId, 0, N'role-proc-test',
                 @FindingKey, N'Role permission fixture finding', @now, @now, 0,
                 @PayloadHashSha256, @now, @now);
            INSERT INTO dbo.RemediationPatterns
                (PatternId, TenantId, PatternKey, DisplayName, CreatedByActorKey, CreatedUtc, UpdatedUtc)
            VALUES (@patternId, @tenantId, @PatternKey, N'Role permission fixture pattern', N'creator', @now, @now);
            INSERT INTO dbo.RemediationPatternVersions
                (VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                 AutomationLevel, AuthorActorKey, ApprovedByActorKey, ApprovedUtc,
                 CreatedUtc, UpdatedUtc)
            VALUES (@versionId, @patternId, @tenantId, N'1.0.0', 1, N'Fixture', N'{}',
                    0, N'creator', N'pattern-approver', @now, @now, @now);
            INSERT INTO dbo.RemediationInstances
                (InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, PatternVersionId,
                 PatternKey, FrozenPatternVersion, AutomationLevel, Status, CreatedByActorKey,
                 CreatedUtc, UpdatedUtc)
            VALUES (@instanceId, @tenantId, @workspaceId, @projectId, @findingId, @patternId, @versionId,
                    @PatternKey, N'1.0.0', 0, 0, N'creator', @now, @now);
            """,
            new
            {
                tenantId, workspaceId, projectId, findingId, patternId, versionId, instanceId, now,
                FindingKey = findingId.ToString("N"),
                PatternKey = "role.procedure." + patternId.ToString("N"),
                PayloadHashSha256 = new byte[32],
            });
        byte[] expectedVersion = await connection.QuerySingleAsync<byte[]>(
            "SELECT RowVersion FROM dbo.RemediationInstances WHERE InstanceId = @instanceId;",
            new { instanceId });

        await connection.ExecuteAsync(
            "EXECUTE AS USER = 'ArchLucidAppRemediationPermissionsTest';");
        try
        {
            foreach ((string table, string permission) in new[]
                     {
                         ("dbo.RemediationEvidence", "UPDATE"),
                         ("dbo.RemediationEvidence", "DELETE"),
                         ("dbo.RemediationInstances", "DELETE"),
                         ("dbo.RemediationInstances", "UPDATE"),
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

            foreach (string procedure in new[]
                     {
                         "dbo.uspRemediationUpdateScoped",
                         "dbo.uspRemediationCommitApproval",
                         "dbo.uspRemediationCommitVerification",
                     })
            {
                int mayExecute = await connection.QuerySingleAsync<int>(
                    "SELECT ISNULL(HAS_PERMS_BY_NAME(@Procedure, N'OBJECT', N'EXECUTE'), 0);",
                    new { Procedure = procedure });
                mayExecute.Should().Be(1, $"app identity must EXECUTE guarded procedure {procedure}");
            }
            int evidenceInsert = await connection.QuerySingleAsync<int>(
                """
                SELECT ISNULL(HAS_PERMS_BY_NAME(
                    N'dbo.RemediationEvidence', N'OBJECT', N'INSERT'), 0);
                """);
            evidenceInsert.Should().Be(1,
                "approval and verification evidence remains appendable");

            int legitimateScopedUpdate = await connection.QuerySingleAsync<int>(
                "dbo.uspRemediationUpdateScoped",
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    InstanceId = instanceId,
                    ExpectedRowVersion = expectedVersion,
                    Status = 1,
                    CloudResourceId = (Guid?)null,
                    PathId = (Guid?)null,
                    PathNarrativeJson = (string?)null,
                    AssessmentId = (Guid?)null,
                    ControlId = (Guid?)null,
                    PreflightSnapshotId = Guid.NewGuid(),
                    ExecutionSnapshotId = (Guid?)null,
                    VerificationSnapshotId = (Guid?)null,
                    WaveId = (Guid?)null,
                    PreflightResultJson = "{\"passed\":true}",
                    VerificationResultJson = (string?)null,
                    ApprovedByActorKey = (string?)null,
                    UpdatedUtc = now,
                    ApprovedUtc = (DateTime?)null,
                    ExecutedUtc = (DateTime?)null,
                    ChangeImplementedUtc = (DateTime?)null,
                    VerifiedUtc = (DateTime?)null,
                    ClosedUtc = (DateTime?)null,
                },
                commandType: System.Data.CommandType.StoredProcedure);
            legitimateScopedUpdate.Should().Be(1,
                "owner-context SQL procedure must be usable even when direct table UPDATE is denied");

            // Even zero-row ad-hoc instance UPDATE must now fail for the runtime role.
            Func<Task> forbiddenDirectUpdate = () => connection.ExecuteAsync(
                "UPDATE dbo.RemediationInstances SET UpdatedUtc = UpdatedUtc WHERE 1 = 0;");
            (await forbiddenDirectUpdate.Should().ThrowAsync<SqlException>()).Which
                .Number.Should().Be(229);
        }
        finally
        {
            await connection.ExecuteAsync("REVERT;");
        }

        int persistedStatus = await connection.QuerySingleAsync<int>(
            "SELECT Status FROM dbo.RemediationInstances WHERE InstanceId = @instanceId;",
            new { instanceId });
        persistedStatus.Should().Be(1, "guarded stored procedure must actually update the row");
    }
}
