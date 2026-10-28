using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlAuditEvidenceProjectIsolationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Architecture_links_are_visible_only_to_owning_project_and_foreign_writes_fail()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory connection = new(fixture.ConnectionString);
        SqlAuditAssessmentRepository assessments = new(connection);
        SqlAuditManualEvidenceRepository evidence = new(connection);
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid projectA = Guid.NewGuid();
        Guid projectB = Guid.NewGuid();
        Guid assessmentA = Guid.NewGuid();
        Guid assessmentB = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        ProjectScopeKey scopeA = ProjectScopeKey.Create(tenant, workspace, projectA);
        ProjectScopeKey scopeB = ProjectScopeKey.Create(tenant, workspace, projectB);

        Guid frameworkId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        SqlAuditFrameworkRepository frameworks = new(connection);
        AuditFrameworkImportResult imported = await frameworks.ImportAsync(
            tenant,
            new AuditFrameworkRecord
            {
                FrameworkId = frameworkId, TenantId = tenant, Name = "Isolation test framework",
                Version = Guid.NewGuid().ToString("N"), SourceReference = "sql-isolation-test",
                ContentHashSha256 = System.Security.Cryptography.SHA256.HashData(Guid.NewGuid().ToByteArray()),
                SpecBlob = [1], CreatedUtc = DateTime.UtcNow,
            },
            [new AuditControlRecord
            {
                ControlId = controlId, FrameworkId = frameworkId, TenantId = tenant,
                ControlNumber = "TEST-01", Title = "Project isolation",
            }],
            new Dictionary<Guid, IReadOnlyDictionary<string, string>>(),
            [new AuditEvidenceRequirementRecord
            {
                RequirementId = requirementId, ControlId = controlId, FrameworkId = frameworkId,
                TenantId = tenant, Name = "Evidence", EvidenceType = "manual",
            }]);
        imported.Succeeded.Should().BeTrue();

        await assessments.InsertAsync(new AuditAssessmentRecord
        {
            AssessmentId = assessmentA, TenantId = tenant, WorkspaceId = workspace, ProjectId = projectA,
            FrameworkId = frameworkId, FrameworkVersion = "1.0", ScopeJson = "{}",
            Status = AuditAssessmentStatus.Collecting, RequestedBy = "sql-test",
            CreatedUtc = DateTime.UtcNow,
        });
        await assessments.InsertAsync(new AuditAssessmentRecord
        {
            AssessmentId = assessmentB, TenantId = tenant, WorkspaceId = workspace, ProjectId = projectB,
            FrameworkId = frameworkId, FrameworkVersion = "1.0", ScopeJson = "{}",
            Status = AuditAssessmentStatus.Collecting, RequestedBy = "sql-test",
            CreatedUtc = DateTime.UtcNow,
        });

        AuditArchitectureEvidenceLinkRecord link = new()
        {
            LinkId = Guid.NewGuid(), TenantId = tenant, AssessmentId = assessmentA,
            ControlId = controlId, RequirementId = requirementId, RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(), LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
        };
        await evidence.InsertArchitectureLinkInScopeAsync(scopeA, link);
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeA, assessmentA))
            .Should().ContainSingle(row => row.LinkId == link.LinkId);
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeB, assessmentA))
            .Should().BeEmpty();
        (await evidence.ListArchitectureLinksByControlInScopeAsync(scopeB, assessmentA, controlId))
            .Should().BeEmpty();
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeA, assessmentB))
            .Should().BeEmpty();

        AuditArchitectureEvidenceLinkRecord projectBLink = new()
        {
            LinkId = Guid.NewGuid(), TenantId = tenant, AssessmentId = assessmentB,
            ControlId = controlId, RequirementId = requirementId, RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(), LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
        };
        await evidence.InsertArchitectureLinkInScopeAsync(scopeB, projectBLink);
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeB, assessmentB))
            .Should().ContainSingle(row => row.LinkId == projectBLink.LinkId);
        (await evidence.ListArchitectureLinksByControlInScopeAsync(scopeB, assessmentB, controlId))
            .Should().ContainSingle(row => row.LinkId == projectBLink.LinkId);
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeA, assessmentB)).Should().BeEmpty();

        AuditArchitectureEvidenceLinkRecord crossProjectLink = new()
        {
            LinkId = Guid.NewGuid(), TenantId = tenant, AssessmentId = assessmentB,
            ControlId = controlId, RequirementId = requirementId, RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(), LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
        };
        Func<Task> crossProjectWrite = () =>
            evidence.InsertArchitectureLinkInScopeAsync(scopeA, crossProjectLink);
        SqlException linkRejection = (await crossProjectWrite.Should().ThrowAsync<SqlException>()).Which;
        linkRejection.Number.Should().Be(50009, "the scoped assessment guard must reject the write");
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeB, assessmentB))
            .Should().ContainSingle(row => row.LinkId == projectBLink.LinkId);

        AuditManualEvidenceSubmissionMutation submission = new()
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = assessmentA,
            ControlId = controlId, RequirementId = requirementId,
            SubmittedBy = "sql-test", SubmittedUtc = DateTime.UtcNow,
            EvidenceHashSha256 = System.Security.Cryptography.SHA256.HashData(Guid.NewGuid().ToByteArray()),
            BlobPointer = "test://audit-evidence", ReviewStatus = AuditEvidenceReviewStatus.Pending,
            ProvenanceKind = ProvenanceKind.HumanAssertion,
        };
        await evidence.InsertSubmissionInScopeAsync(scopeA, submission);
        (await evidence.ListByAssessmentInScopeAsync(scopeA, assessmentA))
            .Should().ContainSingle(row => row.SubmissionId == submission.SubmissionId);
        (await evidence.ListByControlInScopeAsync(scopeA, assessmentA, controlId))
            .Should().ContainSingle(row => row.SubmissionId == submission.SubmissionId);
        (await evidence.TryGetByIdInScopeAsync(scopeA, submission.SubmissionId))
            .Should().NotBeNull();

        (await evidence.ListByAssessmentInScopeAsync(scopeB, assessmentA)).Should().BeEmpty();
        (await evidence.ListByControlInScopeAsync(scopeB, assessmentA, controlId)).Should().BeEmpty();
        (await evidence.TryGetByIdInScopeAsync(scopeB, submission.SubmissionId)).Should().BeNull();
        (await evidence.ListByAssessmentInScopeAsync(scopeA, assessmentB)).Should().BeEmpty();

        AuditManualEvidenceSubmissionMutation projectBSubmission = submission with
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = assessmentB,
        };
        await evidence.InsertSubmissionInScopeAsync(scopeB, projectBSubmission);
        (await evidence.ListByAssessmentInScopeAsync(scopeB, assessmentB))
            .Should().ContainSingle(row => row.SubmissionId == projectBSubmission.SubmissionId);
        (await evidence.ListByControlInScopeAsync(scopeB, assessmentB, controlId))
            .Should().ContainSingle(row => row.SubmissionId == projectBSubmission.SubmissionId);
        (await evidence.TryGetByIdInScopeAsync(scopeB, projectBSubmission.SubmissionId))
            .Should().NotBeNull();
        (await evidence.ListByAssessmentInScopeAsync(scopeA, assessmentB)).Should().BeEmpty();
        (await evidence.TryGetByIdInScopeAsync(scopeA, projectBSubmission.SubmissionId)).Should().BeNull();

        AuditManualEvidenceSubmissionMutation forbiddenSubmission = submission with
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = assessmentB,
        };
        Func<Task> forbiddenWrite = () => evidence.InsertSubmissionInScopeAsync(scopeA, forbiddenSubmission);
        SqlException submissionRejection = (await forbiddenWrite.Should().ThrowAsync<SqlException>()).Which;
        submissionRejection.Number.Should().Be(50008, "the scoped assessment guard must reject the write");
        (await evidence.ListByAssessmentInScopeAsync(scopeB, assessmentB))
            .Should().ContainSingle(row => row.SubmissionId == projectBSubmission.SubmissionId);

        // Additional distinct boundary checks: workspace, tenant, and non-existent assessment.
        ProjectScopeKey wrongWorkspace = ProjectScopeKey.Create(tenant, Guid.NewGuid(), projectA);
        ProjectScopeKey wrongTenant = ProjectScopeKey.Create(Guid.NewGuid(), workspace, projectA);
        Guid missingAssessment = Guid.NewGuid();

        // 1. A different workspace cannot list links for the original project.
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(wrongWorkspace, assessmentA))
            .Should().BeEmpty();
        // 2. A different tenant cannot list the original project's links.
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(wrongTenant, assessmentA))
            .Should().BeEmpty();
        // 3. A missing assessment cannot yield links.
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeA, missingAssessment))
            .Should().BeEmpty();
        // 4. A different workspace cannot list submissions.
        (await evidence.ListByAssessmentInScopeAsync(wrongWorkspace, assessmentA))
            .Should().BeEmpty();
        // 5. A different tenant cannot list submissions.
        (await evidence.ListByAssessmentInScopeAsync(wrongTenant, assessmentA))
            .Should().BeEmpty();
        // 6. A missing assessment cannot yield submissions.
        (await evidence.ListByAssessmentInScopeAsync(scopeA, missingAssessment))
            .Should().BeEmpty();
        // 7. A different workspace cannot look up a known submission by ID.
        (await evidence.TryGetByIdInScopeAsync(wrongWorkspace, submission.SubmissionId))
            .Should().BeNull();
        // 8. A different tenant cannot look up that submission.
        (await evidence.TryGetByIdInScopeAsync(wrongTenant, submission.SubmissionId))
            .Should().BeNull();
        // 9. A foreign workspace cannot insert into the assessment.
        Func<Task> wrongWorkspaceWrite = () =>
            evidence.InsertSubmissionInScopeAsync(wrongWorkspace, submission with { SubmissionId = Guid.NewGuid() });
        (await wrongWorkspaceWrite.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50008);
        // 10. A foreign tenant cannot insert an architecture link for the assessment.
        Func<Task> wrongTenantLinkWrite = () =>
            evidence.InsertArchitectureLinkInScopeAsync(wrongTenant, new AuditArchitectureEvidenceLinkRecord
            {
                LinkId = Guid.NewGuid(), TenantId = wrongTenant.TenantId,
                AssessmentId = assessmentA, ControlId = controlId, RequirementId = requirementId,
                RunId = Guid.NewGuid(), GoldenManifestId = Guid.NewGuid(),
                LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
            });
        (await wrongTenantLinkWrite.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50009);
        // Twenty additional explicit SQL isolation contracts, independent of the first ten.
        // 11. Wrong workspace: architecture links filtered by control.
        (await evidence.ListArchitectureLinksByControlInScopeAsync(wrongWorkspace, assessmentA, controlId)).Should().BeEmpty();
        // 12. Wrong tenant: architecture links filtered by control.
        (await evidence.ListArchitectureLinksByControlInScopeAsync(wrongTenant, assessmentA, controlId)).Should().BeEmpty();
        // 13. Missing assessment: architecture links filtered by control.
        (await evidence.ListArchitectureLinksByControlInScopeAsync(scopeA, missingAssessment, controlId)).Should().BeEmpty();
        // 14. Wrong project: architecture links filtered by control.
        (await evidence.ListArchitectureLinksByControlInScopeAsync(scopeB, assessmentA, controlId)).Should().BeEmpty();
        // 15. Wrong workspace: manual evidence filtered by control.
        (await evidence.ListByControlInScopeAsync(wrongWorkspace, assessmentA, controlId)).Should().BeEmpty();
        // 16. Wrong tenant: manual evidence filtered by control.
        (await evidence.ListByControlInScopeAsync(wrongTenant, assessmentA, controlId)).Should().BeEmpty();
        // 17. Missing assessment: manual evidence filtered by control.
        (await evidence.ListByControlInScopeAsync(scopeA, missingAssessment, controlId)).Should().BeEmpty();
        // 18. Wrong project: manual evidence filtered by control.
        (await evidence.ListByControlInScopeAsync(scopeB, assessmentA, controlId)).Should().BeEmpty();
        // 19. Project B's evidence cannot be listed from a foreign workspace.
        (await evidence.ListByAssessmentInScopeAsync(wrongWorkspace, assessmentB)).Should().BeEmpty();
        // 20. Project B's evidence cannot be listed from a foreign tenant.
        (await evidence.ListByAssessmentInScopeAsync(wrongTenant, assessmentB)).Should().BeEmpty();
        // 21. Project B submission cannot be retrieved by ID from a foreign workspace.
        (await evidence.TryGetByIdInScopeAsync(wrongWorkspace, projectBSubmission.SubmissionId)).Should().BeNull();
        // 22. Project B submission cannot be retrieved by ID from a foreign tenant.
        (await evidence.TryGetByIdInScopeAsync(wrongTenant, projectBSubmission.SubmissionId)).Should().BeNull();
        // 23. A non-existent submission ID never resolves in project A.
        (await evidence.TryGetByIdInScopeAsync(scopeA, Guid.NewGuid())).Should().BeNull();
        // 24. A non-existent submission ID never resolves in project B.
        (await evidence.TryGetByIdInScopeAsync(scopeB, Guid.NewGuid())).Should().BeNull();
        // 25. Project B architecture links cannot be read in a foreign workspace.
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(wrongWorkspace, assessmentB)).Should().BeEmpty();
        // 26. Project B architecture links cannot be read in a foreign tenant.
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(wrongTenant, assessmentB)).Should().BeEmpty();
        // 27. Inserting a link under a foreign workspace must hit the scoped guard.
        Func<Task> deniedWorkspaceLink = () => evidence.InsertArchitectureLinkInScopeAsync(
            wrongWorkspace, new AuditArchitectureEvidenceLinkRecord
            {
                LinkId = Guid.NewGuid(), TenantId = tenant, AssessmentId = assessmentA,
                ControlId = controlId, RequirementId = requirementId, RunId = Guid.NewGuid(),
                GoldenManifestId = Guid.NewGuid(), LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
            });
        (await deniedWorkspaceLink.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50009);
        // 28. Inserting a submission under a foreign tenant must hit the scoped guard.
        Func<Task> deniedTenantSubmission = () => evidence.InsertSubmissionInScopeAsync(
            wrongTenant, submission with { SubmissionId = Guid.NewGuid() });
        (await deniedTenantSubmission.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50008);
        // 29. An unknown assessment cannot receive architecture links.
        Func<Task> deniedMissingLink = () => evidence.InsertArchitectureLinkInScopeAsync(
            scopeA, new AuditArchitectureEvidenceLinkRecord
            {
                LinkId = Guid.NewGuid(), TenantId = tenant, AssessmentId = missingAssessment,
                ControlId = controlId, RequirementId = requirementId, RunId = Guid.NewGuid(),
                GoldenManifestId = Guid.NewGuid(), LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
            });
        (await deniedMissingLink.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50009);
        // 30. An unknown assessment cannot receive manual evidence.
        Func<Task> deniedMissingSubmission = () => evidence.InsertSubmissionInScopeAsync(
            scopeA, submission with { SubmissionId = Guid.NewGuid(), AssessmentId = missingAssessment });
        (await deniedMissingSubmission.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50008);

        // Positive-control records remain intact after denied operations.
        (await evidence.ListByAssessmentInScopeAsync(scopeA, assessmentA))
            .Should().ContainSingle(row => row.SubmissionId == submission.SubmissionId);
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeA, assessmentA))
            .Should().ContainSingle(row => row.LinkId == link.LinkId);
    }
}
