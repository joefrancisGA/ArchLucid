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
public sealed class SqlAuditEvidenceReferentialScopeTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Evidence_inserts_require_control_and_requirement_to_match_assessment_framework()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory connection = new(fixture.ConnectionString);
        SqlAuditFrameworkRepository frameworks = new(connection);
        SqlAuditAssessmentRepository assessments = new(connection);
        SqlAuditManualEvidenceRepository evidence = new(connection);

        Guid tenant = Guid.NewGuid();
        ProjectScopeKey scope = ProjectScopeKey.Create(tenant, Guid.NewGuid(), Guid.NewGuid());
        Guid frameworkA = Guid.NewGuid();
        Guid frameworkB = Guid.NewGuid();
        Guid assessment = Guid.NewGuid();
        Guid controlA = Guid.NewGuid();
        Guid controlB = Guid.NewGuid();
        Guid controlForeign = Guid.NewGuid();
        Guid requirementA = Guid.NewGuid();
        Guid requirementB = Guid.NewGuid();
        Guid requirementForeign = Guid.NewGuid();

        await ImportFramework(frameworkA,
            [
                new AuditControlRecord { ControlId = controlA, TenantId = tenant, FrameworkId = frameworkA, ControlNumber = "A-1", Title = "A1" },
                new AuditControlRecord { ControlId = controlB, TenantId = tenant, FrameworkId = frameworkA, ControlNumber = "A-2", Title = "A2" },
            ],
            [
                new AuditEvidenceRequirementRecord { RequirementId = requirementA, TenantId = tenant, FrameworkId = frameworkA, ControlId = controlA, Name = "A1", EvidenceType = "manual" },
                new AuditEvidenceRequirementRecord { RequirementId = requirementB, TenantId = tenant, FrameworkId = frameworkA, ControlId = controlB, Name = "A2", EvidenceType = "manual" },
            ]);
        await ImportFramework(frameworkB,
            [new AuditControlRecord { ControlId = controlForeign, TenantId = tenant, FrameworkId = frameworkB, ControlNumber = "B-1", Title = "B1" }],
            [new AuditEvidenceRequirementRecord { RequirementId = requirementForeign, TenantId = tenant, FrameworkId = frameworkB, ControlId = controlForeign, Name = "B1", EvidenceType = "manual" }]);

        await assessments.InsertInScopeAsync(scope, new AuditAssessmentCreateMutation
        {
            AssessmentId = assessment, FrameworkId = frameworkA, FrameworkVersion = "1",
            ScopeJson = "{}", Status = AuditAssessmentStatus.Collecting,
            RequestedBy = "referential-test", CreatedUtc = DateTime.UtcNow,
        });

        // Positive controls prove the fixtures are valid and both insert APIs work.
        await evidence.InsertSubmissionInScopeAsync(scope, Submission(controlA, requirementA));
        await evidence.InsertArchitectureLinkInScopeAsync(scope, Link(controlA, requirementA));

        // Four independent negative authorization invariants, all with real FK-valid identifiers.
        await AssertDeniedSubmission(controlForeign, requirementForeign); // 1. Wrong-framework control.
        await AssertDeniedSubmission(controlA, requirementB);              // 2. Wrong-control requirement.
        await AssertDeniedLink(controlForeign, requirementForeign);       // 3. Wrong-framework control.
        await AssertDeniedLink(controlA, requirementB);                   // 4. Wrong-control requirement.

        (await evidence.ListByAssessmentInScopeAsync(scope, assessment)).Should().ContainSingle();
        (await evidence.ListArchitectureLinksByAssessmentInScopeAsync(scope, assessment)).Should().ContainSingle();

        async Task ImportFramework(Guid frameworkId, IReadOnlyList<AuditControlRecord> controls,
            IReadOnlyList<AuditEvidenceRequirementRecord> requirements)
        {
            AuditFrameworkImportResult imported = await frameworks.ImportAsync(tenant, new AuditFrameworkRecord
            {
                FrameworkId = frameworkId, TenantId = tenant, Name = "Referential fixture " + frameworkId,
                Version = frameworkId.ToString("N"), SourceReference = "sql-test",
                ContentHashSha256 = System.Security.Cryptography.SHA256.HashData(frameworkId.ToByteArray()),
                SpecBlob = [1], CreatedUtc = DateTime.UtcNow,
            }, controls, new Dictionary<Guid, IReadOnlyDictionary<string, string>>(), requirements);
            imported.Succeeded.Should().BeTrue();
        }

        AuditManualEvidenceSubmissionMutation Submission(Guid control, Guid requirement) => new()
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = assessment, ControlId = control,
            RequirementId = requirement, SubmittedBy = "sql-test", SubmittedUtc = DateTime.UtcNow,
            EvidenceHashSha256 = System.Security.Cryptography.SHA256.HashData(Guid.NewGuid().ToByteArray()),
            BlobPointer = "test://referential", ReviewStatus = AuditEvidenceReviewStatus.Pending,
            ProvenanceKind = ProvenanceKind.HumanAssertion,
        };

        AuditArchitectureEvidenceLinkRecord Link(Guid control, Guid requirement) => new()
        {
            LinkId = Guid.NewGuid(), TenantId = tenant, AssessmentId = assessment,
            ControlId = control, RequirementId = requirement, RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(), LinkedBy = "sql-test", LinkedUtc = DateTime.UtcNow,
        };

        async Task AssertDeniedSubmission(Guid control, Guid requirement)
        {
            Func<Task> action = () => evidence.InsertSubmissionInScopeAsync(scope, Submission(control, requirement));
            (await action.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50008);
        }

        async Task AssertDeniedLink(Guid control, Guid requirement)
        {
            Func<Task> action = () => evidence.InsertArchitectureLinkInScopeAsync(scope, Link(control, requirement));
            (await action.Should().ThrowAsync<SqlException>()).Which.Number.Should().Be(50009);
        }
    }
}
