using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

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

        AuditArchitectureEvidenceLinkRecord crossProjectLink = new()
        {
            LinkId = Guid.NewGuid(), TenantId = tenant, AssessmentId = assessmentB,
            ControlId = controlId, RequirementId = Guid.NewGuid(), RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(), LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
        };
        Func<Task> crossProjectWrite = () =>
            evidence.InsertArchitectureLinkInScopeAsync(scopeA, crossProjectLink);
        await crossProjectWrite.Should().ThrowAsync<Exception>();
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scopeB, assessmentB))
            .Should().BeEmpty();

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

        AuditManualEvidenceSubmissionMutation forbiddenSubmission = submission with
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = assessmentB,
        };
        Func<Task> forbiddenWrite = () => evidence.InsertSubmissionInScopeAsync(scopeA, forbiddenSubmission);
        await forbiddenWrite.Should().ThrowAsync<Exception>();
        (await evidence.ListByAssessmentInScopeAsync(scopeB, assessmentB)).Should().BeEmpty();
    }
}
