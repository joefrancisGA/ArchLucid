using System.Text.RegularExpressions;

using ArchLucid.Persistence.InfraEvidence;

using Dapper;
using FluentAssertions;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
/// Disposable SQL Server proof that the actual migration denies remediation
/// evidence edits/deletes and instance UPDATE/DELETE to the application role,
/// even when that principal also has db_datawriter rights. It proves a guarded
/// owner-context update succeeds, and a repeated stale CAS does not.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class RemediationSqlRolePrivilegesTests(SqlServerPersistenceFixture fixture)
{
    private const string RoleName = "ArchLucidApp";

    [SkippableFact]
    public async Task Role_denies_direct_dml_but_allows_guarded_procedure_and_rejects_stale_rowversion()
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
        foreach (int migrationNumber in new[] { 426, 427, 428 })
        {
            string resource = typeof(SqlRemediationInstanceRepository).Assembly
                .GetManifestResourceNames()
                .Single(name => name.Contains($".Migrations.{migrationNumber}_", StringComparison.Ordinal)
                    && name.EndsWith(".sql", StringComparison.Ordinal));
            await using Stream migrationStream = typeof(SqlRemediationInstanceRepository).Assembly
                .GetManifestResourceStream(resource)!;
            using StreamReader reader = new(migrationStream);
            string migrationSql = await reader.ReadToEndAsync();
            // Repeat all real migrations after role provisioning to verify idempotence.
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
                     ("dbo.RemediationInstances", "INSERT"),
                     ("dbo.RemediationEvidence", "INSERT"),
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
        Guid waveInstanceId = Guid.NewGuid();
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
            VALUES (@versionId, @patternId, @tenantId, N'1.0.0', 2, N'Fixture', N'{}',
                    0, N'creator', N'pattern-approver', @now, @now, @now);
            INSERT INTO dbo.RemediationInstances
                (InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, PatternVersionId,
                 PatternKey, FrozenPatternVersion, AutomationLevel, Status, CreatedByActorKey,
                 CreatedUtc, UpdatedUtc)
            VALUES (@instanceId, @tenantId, @workspaceId, @projectId, @findingId, @patternId, @versionId,
                    @PatternKey, N'1.0.0', 0, 0, N'creator', @now, @now),
                   (@waveInstanceId, @tenantId, @workspaceId, @projectId, @findingId, @patternId, @versionId,
                    @PatternKey, N'1.0.0', 0, 4, N'creator', @now, @now);
            """,
            new
            {
                tenantId, workspaceId, projectId, findingId, patternId, versionId, instanceId, waveInstanceId, now,
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
                         ("dbo.RemediationInstances", "INSERT"),
                         ("dbo.RemediationEvidence", "INSERT"),
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
                         "dbo.uspRemediationCreateScoped",
                         "dbo.uspRemediationAppendEvidenceScoped",
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
            evidenceInsert.Should().Be(0,
                "direct INSERT must not mint approval or verification evidence");

            Func<Task> forbiddenInstanceInsert = () => connection.ExecuteAsync(
                "INSERT INTO dbo.RemediationInstances (InstanceId) SELECT NEWID() WHERE 1 = 0;");
            Func<Task> forbiddenEvidenceInsert = () => connection.ExecuteAsync(
                "INSERT INTO dbo.RemediationEvidence (EvidenceId) SELECT NEWID() WHERE 1 = 0;");
            (await forbiddenInstanceInsert.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(229);
            (await forbiddenEvidenceInsert.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(229);

            Guid createdId = Guid.NewGuid();
            var creation = new
            {
                InstanceId = createdId, TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId,
                FindingId = findingId, PatternId = patternId, PatternVersionId = versionId,
                PatternKey = "role.procedure." + patternId.ToString("N"), FrozenPatternVersion = "1.0.0",
                AutomationLevel = 0, Status = 0, CloudResourceId = (Guid?)null, PathId = (Guid?)null,
                PathNarrativeJson = (string?)null, AssessmentId = (Guid?)null, ControlId = (Guid?)null,
                PreflightSnapshotId = (Guid?)null, ExecutionSnapshotId = (Guid?)null,
                VerificationSnapshotId = (Guid?)null, WaveId = (Guid?)null,
                PreflightResultJson = (string?)null, VerificationResultJson = (string?)null,
                CreatedByActorKey = "creator", ApprovedByActorKey = (string?)null,
                CreatedUtc = now, UpdatedUtc = now, ApprovedUtc = (DateTime?)null,
                ExecutedUtc = (DateTime?)null, ChangeImplementedUtc = (DateTime?)null,
                VerifiedUtc = (DateTime?)null, ClosedUtc = (DateTime?)null,
            };
            await connection.ExecuteAsync("dbo.uspRemediationCreateScoped", creation,
                commandType: System.Data.CommandType.StoredProcedure);
            (await connection.QuerySingleAsync<int>(
                "SELECT Status FROM dbo.RemediationInstances WHERE InstanceId = @createdId", new { createdId }))
                .Should().Be(0);
            foreach (int forgedStatus in new[] { 1, 3, 6 })
            {
                DynamicParameters forged = new(creation);
                forged.Add("InstanceId", Guid.NewGuid());
                forged.Add("Status", forgedStatus);
                Func<Task> forge = () => connection.ExecuteAsync("dbo.uspRemediationCreateScoped", forged,
                    commandType: System.Data.CommandType.StoredProcedure);
                (await forge.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50428);
            }
            DynamicParameters foreignCreation = new(creation);
            foreignCreation.Add("InstanceId", Guid.NewGuid());
            foreignCreation.Add("ProjectId", Guid.NewGuid());
            Func<Task> foreignCreate = () => connection.ExecuteAsync("dbo.uspRemediationCreateScoped", foreignCreation,
                commandType: System.Data.CommandType.StoredProcedure);
            (await foreignCreate.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50428);

            var append = new
            {
                TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId,
                EvidenceId = Guid.NewGuid(), InstanceId = waveInstanceId, Phase = 0,
                PayloadJson = "{}", ActorKey = "actor", CorrelationId = "append-test", CreatedUtc = now,
            };
            foreach (int phase in new[] { 0, 1, 2 })
            {
                DynamicParameters ordinary = new(append);
                ordinary.Add("EvidenceId", Guid.NewGuid());
                ordinary.Add("Phase", phase);
                await connection.ExecuteAsync("dbo.uspRemediationAppendEvidenceScoped", ordinary,
                    commandType: System.Data.CommandType.StoredProcedure);
            }
            foreach (int phase in new[] { 3, 4, 99 })
            {
                DynamicParameters forged = new(append);
                forged.Add("Phase", phase);
                Func<Task> forge = () => connection.ExecuteAsync("dbo.uspRemediationAppendEvidenceScoped", forged,
                    commandType: System.Data.CommandType.StoredProcedure);
                (await forge.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50428);
            }
            DynamicParameters foreignAppend = new(append);
            foreignAppend.Add("ProjectId", Guid.NewGuid());
            Func<Task> wrongScope = () => connection.ExecuteAsync("dbo.uspRemediationAppendEvidenceScoped", foreignAppend,
                commandType: System.Data.CommandType.StoredProcedure);
            (await wrongScope.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50428);
            DynamicParameters earlyAppend = new(append);
            earlyAppend.Add("InstanceId", createdId);
            Func<Task> wrongState = () => connection.ExecuteAsync("dbo.uspRemediationAppendEvidenceScoped", earlyAppend,
                commandType: System.Data.CommandType.StoredProcedure);
            (await wrongState.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50428);
            (await connection.QuerySingleAsync<int>(
                "SELECT COUNT(*) FROM dbo.RemediationEvidence WHERE InstanceId = @waveInstanceId", new { waveInstanceId }))
                .Should().Be(3);

            var scopedMutation = new
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
                };
            int legitimateScopedUpdate = await connection.QuerySingleAsync<int>(
                "dbo.uspRemediationUpdateScoped",
                scopedMutation,
                commandType: System.Data.CommandType.StoredProcedure);
            legitimateScopedUpdate.Should().Be(1,
                "owner-context SQL procedure must be usable even when direct table UPDATE is denied");

            // Classified -> PreflightPassed already occurred; PreflightPassed ->
            // PreflightBlocked is still a valid transition. Reusing the old
            // token must fail specifically because the rowversion advanced.
            DynamicParameters staleMutation = new(scopedMutation);
            staleMutation.Add("Status", 2);
            int staleRetry = await connection.QuerySingleAsync<int>(
                "dbo.uspRemediationUpdateScoped",
                staleMutation,
                commandType: System.Data.CommandType.StoredProcedure);
            staleRetry.Should().Be(0,
                "an otherwise-allowed transition must reject a stale rowversion");

            // Even zero-row ad-hoc instance UPDATE must now fail for the runtime role.
            Func<Task> forbiddenDirectUpdate = () => connection.ExecuteAsync(
                "UPDATE dbo.RemediationInstances SET UpdatedUtc = UpdatedUtc WHERE 1 = 0;");
            (await forbiddenDirectUpdate.Should().ThrowAsync<SqlException>()).Which
                .Number.Should().Be(229);

            // Approval must remain atomic and usable despite direct evidence INSERT denial.
            byte[] approvedFrom = await connection.QuerySingleAsync<byte[]>(
                "SELECT RowVersion FROM dbo.RemediationInstances WHERE InstanceId = @instanceId", new { instanceId });
            Guid approvalId = Guid.NewGuid();
            int approved = await connection.QuerySingleAsync<int>("dbo.uspRemediationCommitApproval",
                new
                {
                    TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, InstanceId = instanceId,
                    ExpectedRowVersion = approvedFrom, ApprovedByActorKey = "approver", ApprovedUtc = now,
                    UpdatedUtc = now, EvidenceId = approvalId, PayloadJson = "{}", ActorKey = "approver",
                    CorrelationId = "approval-test", CreatedUtc = now,
                }, commandType: System.Data.CommandType.StoredProcedure);
            approved.Should().Be(1);
            (await connection.QuerySingleAsync<int>(
                "SELECT Phase FROM dbo.RemediationEvidence WHERE EvidenceId = @approvalId", new { approvalId }))
                .Should().Be(4);
        }
        finally
        {
            await connection.ExecuteAsync("REVERT;");
        }

        int persistedStatus = await connection.QuerySingleAsync<int>(
            "SELECT Status FROM dbo.RemediationInstances WHERE InstanceId = @instanceId;",
            new { instanceId });
        persistedStatus.Should().Be(3, "guarded stored procedures must actually approve the row");
    }
}
