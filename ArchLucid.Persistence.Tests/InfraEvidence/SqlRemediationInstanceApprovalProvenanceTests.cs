using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;
using FluentAssertions;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

/// <summary>
/// Disposable SQL-catalog exercise of the real atomic approval/evidence
/// transaction. This does NOT approve FND-015 plans or execute cloud changes.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class SqlRemediationInstanceApprovalProvenanceTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Approval_writes_evidence_atomically_and_rejects_stale_foreign_and_failed_evidence_inserts()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable,
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionStringBuilder builder = new(fixture.ConnectionString);
        builder.InitialCatalog.Should().Contain("Test",
            "only disposable SQL test catalogs are permitted");
        ProjectScopeKey scope = ProjectScopeKey.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        SqlRemediationInstanceRepository repository =
            new(new SqlConnectionFactory(fixture.ConnectionString));
        Guid findingId = Guid.NewGuid();
        Guid patternId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;

        // Seed only the two FK parents required by the remediation-instance
        // table; never use customer subscriptions or hosted infrastructure.
        await using (SqlConnection connection = new(fixture.ConnectionString))
        {
            await connection.OpenAsync();
            await connection.ExecuteAsync(
                """
                INSERT INTO dbo.OperationalSecurityFindings
                    (FindingId, TenantId, WorkspaceId, ProjectId, Provider,
                     SourceSystem, SourceFindingId, Title, FirstObservedUtc,
                     LastObservedUtc, Status, PayloadHashSha256, CreatedUtc, UpdatedUtc)
                VALUES
                    (@FindingId, @TenantId, @WorkspaceId, @ProjectId, @Provider,
                     N'approval-provenance-test', @SourceFindingId, N'Test finding',
                     @Now, @Now, 0, @PayloadHashSha256, @Now, @Now);
                INSERT INTO dbo.RemediationPatterns
                    (PatternId, TenantId, PatternKey, DisplayName, CreatedByActorKey,
                     CreatedUtc, UpdatedUtc)
                VALUES (@PatternId, @TenantId, @PatternKey, N'Test pattern',
                        N'author', @Now, @Now);
                INSERT INTO dbo.RemediationPatternVersions
                    (VersionId, PatternId, TenantId, Version, Status,
                     ControlObjective, ContentJson, AutomationLevel,
                     AuthorActorKey, ApprovedByActorKey, ApprovedUtc,
                     CreatedUtc, UpdatedUtc)
                VALUES (@VersionId, @PatternId, @TenantId, N'1.0.0',
                        @PatternStatus, N'Test objective', N'{}',
                        0, N'author', N'pattern-approver', @Now, @Now, @Now);
                """,
                new
                {
                    findingId, scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                    Provider = (int)CloudProvider.Azure,
                    SourceFindingId = findingId.ToString("N"),
                    PayloadHashSha256 = new byte[32],
                    patternId, PatternKey = "test.approval." + patternId.ToString("N"),
                    versionId, PatternStatus = (int)RemediationPatternStatus.Approved,
                    Now = now,
                });
        }

        Guid firstId = Guid.NewGuid();
        await InsertPreflightPassedAsync(firstId);
        RemediationInstanceRecord firstBefore = (await repository
            .TryGetByIdInScopeAsync(scope, firstId))!;
        firstBefore.RowVersion.Should().HaveCount(8);

        RemediationInstanceMutation approval = Mutation(firstBefore);
        RemediationEvidenceRecord evidence = Evidence(firstId);
        await repository.CommitApprovalInScopeAsync(scope, approval, evidence);

        RemediationInstanceRecord firstAfter = (await repository
            .TryGetByIdInScopeAsync(scope, firstId))!;
        firstAfter.Status.Should().Be(RemediationInstanceStatus.Approved);
        firstAfter.ApprovedByActorKey.Should().Be("independent-approver");
        IReadOnlyList<RemediationEvidenceRecord> firstEvidence =
            await repository.ListEvidenceByInstanceInScopeAsync(scope, firstId);
        firstEvidence.Should().ContainSingle();
        firstEvidence[0].Phase.Should().Be(RemediationEvidencePhase.Approval);

        Func<Task> duplicate = () =>
            repository.CommitApprovalInScopeAsync(scope, approval, Evidence(firstId));
        await duplicate.Should().ThrowAsync<InvalidOperationException>();
        (await repository.ListEvidenceByInstanceInScopeAsync(scope, firstId))
            .Should().ContainSingle("a stale approval must never append another receipt");

        Guid secondId = Guid.NewGuid();
        await InsertPreflightPassedAsync(secondId);
        RemediationInstanceRecord secondBefore = (await repository
            .TryGetByIdInScopeAsync(scope, secondId))!;

        ProjectScopeKey foreign = ProjectScopeKey.Create(
            scope.TenantId, scope.WorkspaceId, Guid.NewGuid());
        Func<Task> wrongScope = () => repository.CommitApprovalInScopeAsync(
            foreign, Mutation(secondBefore), Evidence(secondId));
        await wrongScope.Should().ThrowAsync<InvalidOperationException>();

        // The UPDATE succeeds, but the INSERT conflicts with the first
        // receipt's primary key: the transaction must roll back the approval.
        RemediationEvidenceRecord duplicateEvidenceId = new()
        {
            EvidenceId = evidence.EvidenceId,
            InstanceId = secondId,
            TenantId = scope.TenantId,
            Phase = RemediationEvidencePhase.Approval,
            PayloadJson = "{}",
            ActorKey = "independent-approver",
            CorrelationId = "sql-test",
            CreatedUtc = now,
        };
        RemediationInstanceMutation secondApproval = Mutation(secondBefore);
        secondApproval = secondApproval with
        {
            ApprovedUtc = now,
            UpdatedUtc = now,
        };
        Func<Task> failingInsert = () => repository.CommitApprovalInScopeAsync(
            scope, secondApproval, duplicateEvidenceId);
        await failingInsert.Should().ThrowAsync<SqlException>();
        RemediationInstanceRecord secondAfter = (await repository
            .TryGetByIdInScopeAsync(scope, secondId))!;
        secondAfter.Status.Should().Be(RemediationInstanceStatus.PreflightPassed);
        secondAfter.ApprovedByActorKey.Should().BeNull();
        (await repository.ListEvidenceByInstanceInScopeAsync(scope, secondId))
            .Should().BeEmpty();

        // Every protected update must reject a missing or stale token.
        // The previous SQL condition treated NULL as a wildcard.
        RemediationInstanceMutation scopedChange = new()
        {
            InstanceId = secondId,
            Status = RemediationInstanceStatus.PreflightBlocked,
            UpdatedUtc = now,
        };
        Func<Task> missingUpdate = () => repository.UpdateInstanceInScopeAsync(scope, scopedChange);
        await missingUpdate.Should().ThrowAsync<InvalidOperationException>();
        Func<Task> staleUpdate = () => repository.UpdateInstanceInScopeAsync(
            scope, scopedChange with { ExpectedRowVersion = new byte[8] });
        await staleUpdate.Should().ThrowAsync<InvalidOperationException>();
        Func<Task> foreignUpdate = () => repository.UpdateInstanceInScopeAsync(
            foreign, scopedChange with { ExpectedRowVersion = secondAfter.RowVersion });
        await foreignUpdate.Should().ThrowAsync<InvalidOperationException>();

        RemediationInstanceMutation verification = new()
        {
            InstanceId = secondId,
            Status = RemediationInstanceStatus.VerificationFailed,
            VerificationSnapshotId = Guid.NewGuid(),
            VerificationResultJson = "{\\"passed\\":false}",
            VerifiedUtc = now,
            UpdatedUtc = now,
        };
        RemediationEvidenceRecord verificationProof = new()
        {
            EvidenceId = Guid.NewGuid(),
            InstanceId = secondId,
            TenantId = scope.TenantId,
            Phase = RemediationEvidencePhase.Verify,
            PayloadJson = "{\\"passed\\":false}",
            ActorKey = "verifier",
            CorrelationId = "sql-rowversion-check",
            CreatedUtc = now,
        };
        Func<Task> missingVerification = () => repository.CommitVerificationInScopeAsync(
            scope, verification, verificationProof);
        await missingVerification.Should().ThrowAsync<InvalidOperationException>();
        Func<Task> staleVerification = () => repository.CommitVerificationInScopeAsync(
            scope, verification with { ExpectedRowVersion = new byte[8] },
            verificationProof);
        await staleVerification.Should().ThrowAsync<InvalidOperationException>();
        Func<Task> foreignVerification = () => repository.CommitVerificationInScopeAsync(
            foreign, verification with { ExpectedRowVersion = secondAfter.RowVersion },
            verificationProof);
        await foreignVerification.Should().ThrowAsync<InvalidOperationException>();

        (await repository.TryGetByIdInScopeAsync(scope, secondId))!.Status.Should()
            .Be(RemediationInstanceStatus.PreflightPassed);
        (await repository.ListEvidenceByInstanceInScopeAsync(scope, secondId))
            .Should().BeEmpty("failed verification must never insert evidence");

        // A legitimate current-row CAS still works, and its old token
        // becomes stale after the database-generated rowversion advances.
        await repository.UpdateInstanceInScopeAsync(
            scope, scopedChange with { ExpectedRowVersion = secondAfter.RowVersion });
        RemediationInstanceRecord changed = (await repository
            .TryGetByIdInScopeAsync(scope, secondId))!;
        changed.Status.Should().Be(RemediationInstanceStatus.PreflightBlocked);
        changed.RowVersion.Should().NotEqual(secondAfter.RowVersion);
        Func<Task> repeatedWithStaleToken = () => repository.UpdateInstanceInScopeAsync(
            scope, scopedChange with { ExpectedRowVersion = secondAfter.RowVersion });
        await repeatedWithStaleToken.Should().ThrowAsync<InvalidOperationException>();

        async Task InsertPreflightPassedAsync(Guid id)
        {
            await repository.InsertInstanceInScopeAsync(scope, new RemediationInstanceRecord
            {
                InstanceId = id,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                FindingId = findingId,
                PatternId = patternId,
                PatternVersionId = versionId,
                PatternKey = "test.approval." + patternId.ToString("N"),
                FrozenPatternVersion = "1.0.0",
                AutomationLevel = RemediationAutomationLevel.Manual,
                Status = RemediationInstanceStatus.PreflightPassed,
                PreflightSnapshotId = Guid.NewGuid(),
                PreflightResultJson = "{\"passed\":true}",
                CreatedByActorKey = "creator",
                CreatedUtc = now,
                UpdatedUtc = now,
            });
        }

        RemediationInstanceMutation Mutation(RemediationInstanceRecord record) => new()
        {
            InstanceId = record.InstanceId,
            Status = RemediationInstanceStatus.Approved,
            ExpectedRowVersion = record.RowVersion,
            ApprovedByActorKey = "independent-approver",
            ApprovedUtc = now,
            UpdatedUtc = now,
        };

        RemediationEvidenceRecord Evidence(Guid id) => new()
        {
            EvidenceId = Guid.NewGuid(),
            InstanceId = id,
            TenantId = scope.TenantId,
            Phase = RemediationEvidencePhase.Approval,
            PayloadJson = "{\"kind\":\"approval-provenance\"}",
            ActorKey = "independent-approver",
            CorrelationId = "sql-test",
            CreatedUtc = now,
        };
    }
}
