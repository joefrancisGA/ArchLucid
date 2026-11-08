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
public sealed class SqlAuditManualEvidenceScopePredicateTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Submission_insert_rejects_each_scope_component_independently()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory connection = new(fixture.ConnectionString);
        SqlAuditFrameworkRepository frameworks = new(connection);
        SqlAuditAssessmentRepository assessments = new(connection);
        SqlAuditManualEvidenceRepository evidence = new(connection);

        Guid tenant = Guid.NewGuid();
        ProjectScopeKey owningScope = ProjectScopeKey.Create(tenant, Guid.NewGuid(), Guid.NewGuid());
        Guid framework = Guid.NewGuid();
        Guid assessment = Guid.NewGuid();
        Guid control = Guid.NewGuid();
        Guid requirement = Guid.NewGuid();

        AuditFrameworkImportResult imported = await frameworks.ImportAsync(tenant, new AuditFrameworkRecord
        {
            FrameworkId = framework, TenantId = tenant, Name = "Scope predicate fixture " + framework,
            Version = framework.ToString("N"), SourceReference = "sql-test",
            ContentHashSha256 = System.Security.Cryptography.SHA256.HashData(framework.ToByteArray()),
            SpecBlob = [1], CreatedUtc = DateTime.UtcNow,
        },
        [
            new AuditControlRecord { ControlId = control, TenantId = tenant, FrameworkId = framework, ControlNumber = "A-1", Title = "A1" },
        ],
        new Dictionary<Guid, IReadOnlyDictionary<string, string>>(),
        [
            new AuditEvidenceRequirementRecord { RequirementId = requirement, TenantId = tenant, FrameworkId = framework, ControlId = control, Name = "A1", EvidenceType = "manual" },
        ]);
        imported.Succeeded.Should().BeTrue();

        await assessments.InsertInScopeAsync(owningScope, new AuditAssessmentCreateMutation
        {
            AssessmentId = assessment, FrameworkId = framework, FrameworkVersion = "1",
            ScopeJson = "{}", Status = AuditAssessmentStatus.Collecting,
            RequestedBy = "scope-predicate-test", CreatedUtc = DateTime.UtcNow,
        });

        // Positive control: the assessment, control, and requirement all exist in SQL and
        // the owning scope is authorized, so this insert must succeed.
        await evidence.InsertSubmissionInScopeAsync(owningScope, Submission());

        // Each foreign scope differs from the owning scope in exactly one component
        // (tenant, workspace, or project). The assessment, control, and requirement IDs
        // are unchanged and exist in the database, so only a missing tenant, workspace,
        // or project authorization predicate in the INSERT...SELECT could allow the write.
        ProjectScopeKey foreignTenant = ProjectScopeKey.Create(Guid.NewGuid(), owningScope.WorkspaceId, owningScope.ProjectId);
        ProjectScopeKey foreignWorkspace = ProjectScopeKey.Create(tenant, Guid.NewGuid(), owningScope.ProjectId);
        ProjectScopeKey foreignProject = ProjectScopeKey.Create(tenant, owningScope.WorkspaceId, Guid.NewGuid());

        int denied = 0;
        foreach (ProjectScopeKey foreignScope in new[] { foreignTenant, foreignWorkspace, foreignProject })
        {
            Func<Task> action = () => evidence.InsertSubmissionInScopeAsync(foreignScope, Submission());
            (await action.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50008);
            denied++;
        }
        denied.Should().Be(3);

        // Verify through the owning scope that only the positive-control submission persisted:
        // none of the three denied inserts leaked a row into the assessment.
        IReadOnlyList<AuditManualEvidenceSubmissionRecord> persisted =
            await evidence.ListByAssessmentInScopeAsync(owningScope, assessment);
        persisted.Should().HaveCount(1);

        AuditManualEvidenceSubmissionMutation Submission() => new()
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = assessment, ControlId = control,
            RequirementId = requirement, SubmittedBy = "sql-test", SubmittedUtc = DateTime.UtcNow,
            EvidenceHashSha256 = System.Security.Cryptography.SHA256.HashData(Guid.NewGuid().ToByteArray()),
            BlobPointer = "test://scope-predicate", ReviewStatus = AuditEvidenceReviewStatus.Pending,
            ProvenanceKind = ProvenanceKind.HumanAssertion,
        };
    }
}
