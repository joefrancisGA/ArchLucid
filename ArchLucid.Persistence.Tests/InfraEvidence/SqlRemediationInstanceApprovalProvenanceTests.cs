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
            VerificationResultJson = "{\"passed\":false}",
            VerifiedUtc = now,
            UpdatedUtc = now,
        };
        RemediationEvidenceRecord verificationProof = new()
        {
            EvidenceId = Guid.NewGuid(),
            InstanceId = secondId,
            TenantId = scope.TenantId,
            Phase = RemediationEvidencePhase.Verify,
            PayloadJson = "{\"passed\":false}",
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

    [SkippableFact]
    public async Task Verification_commits_evidence_atomically_and_rolls_back_when_receipt_insert_fails()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable,
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionStringBuilder builder = new(fixture.ConnectionString);
        builder.InitialCatalog.Should().Contain("Test",
            "the verification rollback test must never modify a production catalog");

        ProjectScopeKey scope = ProjectScopeKey.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        Guid findingId = Guid.NewGuid();
        Guid patternId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        Guid firstId = Guid.NewGuid();
        Guid secondId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;
        SqlRemediationInstanceRepository repository =
            new(new SqlConnectionFactory(fixture.ConnectionString));

        await using (SqlConnection connection = new(fixture.ConnectionString))
        {
            await connection.OpenAsync();
            await connection.ExecuteAsync(
                """
                INSERT INTO dbo.OperationalSecurityFindings
                    (FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem,
                     SourceFindingId, Title, FirstObservedUtc, LastObservedUtc, Status,
                     PayloadHashSha256, CreatedUtc, UpdatedUtc)
                VALUES
                    (@FindingId, @TenantId, @WorkspaceId, @ProjectId, @Provider, N'verification-atomic-test',
                     @SourceFindingId, N'Verification transaction fixture', @Now, @Now, 0,
                     @PayloadHashSha256, @Now, @Now);
                INSERT INTO dbo.RemediationPatterns
                    (PatternId, TenantId, PatternKey, DisplayName, CreatedByActorKey, CreatedUtc, UpdatedUtc)
                VALUES (@PatternId, @TenantId, @PatternKey, N'Verification fixture', N'author', @Now, @Now);
                INSERT INTO dbo.RemediationPatternVersions
                    (VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                     AutomationLevel, AuthorActorKey, ApprovedByActorKey, ApprovedUtc, CreatedUtc, UpdatedUtc)
                VALUES (@VersionId, @PatternId, @TenantId, N'1.0.0', @ApprovedPatternStatus,
                        N'Fixture', N'{}', 0, N'author', N'pattern-approver', @Now, @Now, @Now);
                INSERT INTO dbo.RemediationInstances
                    (InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId,
                     PatternVersionId, PatternKey, FrozenPatternVersion, AutomationLevel,
                     Status, CreatedByActorKey, CreatedUtc, UpdatedUtc, ChangeImplementedUtc)
                VALUES
                    (@FirstId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @PatternId,
                     @VersionId, @PatternKey, N'1.0.0', 0, @ChangeImplementedStatus,
                     N'creator', @Now, @Now, @Now),
                    (@SecondId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @PatternId,
                     @VersionId, @PatternKey, N'1.0.0', 0, @ChangeImplementedStatus,
                     N'creator', @Now, @Now, @Now);
                """,
                new
                {
                    findingId, patternId, versionId,
                    FirstId = firstId, SecondId = secondId,
                    scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                    Provider = (int)CloudProvider.Azure,
                    SourceFindingId = findingId.ToString("N"),
                    PayloadHashSha256 = new byte[32],
                    PatternKey = "test.verification." + patternId.ToString("N"),
                    ApprovedPatternStatus = (int)RemediationPatternStatus.Approved,
                    ChangeImplementedStatus = (int)RemediationInstanceStatus.ChangeImplemented,
                    Now = now,
                });
        }

        RemediationInstanceRecord firstBefore = (await repository.TryGetByIdInScopeAsync(scope, firstId))!;
        RemediationInstanceRecord secondBefore = (await repository.TryGetByIdInScopeAsync(scope, secondId))!;
        firstBefore.RowVersion.Should().HaveCount(8);
        secondBefore.RowVersion.Should().HaveCount(8);

        const string verificationJson = "{\"passed\":true}";
        RemediationInstanceMutation firstVerification = new()
        {
            InstanceId = firstId,
            Status = RemediationInstanceStatus.Verified,
            ExpectedRowVersion = firstBefore.RowVersion,
            VerificationSnapshotId = Guid.NewGuid(),
            VerificationResultJson = verificationJson,
            VerifiedUtc = now,
            UpdatedUtc = now,
        };
        RemediationEvidenceRecord evidence = new()
        {
            EvidenceId = Guid.NewGuid(),
            InstanceId = firstId,
            TenantId = scope.TenantId,
            Phase = RemediationEvidencePhase.Verify,
            PayloadJson = verificationJson,
            ActorKey = "independent-verifier",
            CorrelationId = "sql-verification-transaction",
            CreatedUtc = now,
        };

        await repository.CommitVerificationInScopeAsync(scope, firstVerification, evidence);
        RemediationInstanceRecord firstAfter = (await repository.TryGetByIdInScopeAsync(scope, firstId))!;
        firstAfter.Status.Should().Be(RemediationInstanceStatus.Verified);
        firstAfter.RowVersion.Should().NotEqual(firstBefore.RowVersion);
        (await repository.ListEvidenceByInstanceInScopeAsync(scope, firstId))
            .Should().ContainSingle().Which.Phase.Should().Be(RemediationEvidencePhase.Verify);

        // A replay with the original token cannot append an additional receipt.
        Func<Task> stale = () => repository.CommitVerificationInScopeAsync(
            scope, firstVerification, evidence with { EvidenceId = Guid.NewGuid() });
        await stale.Should().ThrowAsync<InvalidOperationException>();
        (await repository.ListEvidenceByInstanceInScopeAsync(scope, firstId))
            .Should().ContainSingle("stale verification cannot append evidence");

        // The scope predicate must reject a valid token from another project.
        ProjectScopeKey foreign = ProjectScopeKey.Create(
            scope.TenantId, scope.WorkspaceId, Guid.NewGuid());
        RemediationInstanceMutation secondVerification = firstVerification with
        {
            InstanceId = secondId,
            ExpectedRowVersion = secondBefore.RowVersion,
        };
        Func<Task> wrongScope = () => repository.CommitVerificationInScopeAsync(
            foreign, secondVerification,
            evidence with { EvidenceId = Guid.NewGuid(), InstanceId = secondId });
        await wrongScope.Should().ThrowAsync<InvalidOperationException>();

        // The UPDATE would match, but the duplicate evidence primary key must
        // abort the transaction, restoring both status and rowversion.
        Func<Task> duplicateReceipt = () => repository.CommitVerificationInScopeAsync(
            scope, secondVerification, evidence with { InstanceId = secondId });
        await duplicateReceipt.Should().ThrowAsync<SqlException>();

        RemediationInstanceRecord secondAfter = (await repository.TryGetByIdInScopeAsync(scope, secondId))!;
        secondAfter.Status.Should().Be(RemediationInstanceStatus.ChangeImplemented);
        secondAfter.RowVersion.Should().Equal(secondBefore.RowVersion);
        (await repository.ListEvidenceByInstanceInScopeAsync(scope, secondId))
            .Should().BeEmpty("verification state and evidence must roll back together");
    }

}
