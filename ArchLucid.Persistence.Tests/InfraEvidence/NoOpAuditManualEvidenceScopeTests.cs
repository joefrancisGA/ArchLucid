using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

public sealed class NoOpAuditManualEvidenceScopeTests
{
    [Fact]
    public async Task Scoped_methods_remain_inert_without_falling_back_to_tenant_only_contracts()
    {
        IAuditManualEvidenceRepository repository = new NoOpAuditManualEvidenceRepository();
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        Guid assessment = Guid.NewGuid();
        Guid control = Guid.NewGuid();
        Guid requirement = Guid.NewGuid();
        AuditManualEvidenceSubmissionMutation submission = new()
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = assessment, ControlId = control,
            RequirementId = requirement, SubmittedBy = "test", SubmittedUtc = DateTime.UtcNow,
            EvidenceHashSha256 = new byte[32], BlobPointer = "test://inert",
            ReviewStatus = AuditEvidenceReviewStatus.Pending, ProvenanceKind = ProvenanceKind.HumanAssertion,
        };
        AuditArchitectureEvidenceLinkRecord link = new()
        {
            LinkId = Guid.NewGuid(), TenantId = scope.TenantId, AssessmentId = assessment,
            ControlId = control, RequirementId = requirement, RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(), LinkedBy = "test", LinkedUtc = DateTime.UtcNow,
        };
        await repository.InsertSubmissionInScopeAsync(scope, submission);
        await repository.InsertArchitectureLinkInScopeAsync(scope, link);
        (await repository.ListByAssessmentInScopeAsync(scope, assessment)).Should().BeEmpty();
        (await repository.ListByControlInScopeAsync(scope, assessment, control)).Should().BeEmpty();
        (await repository.TryGetByIdInScopeAsync(scope, submission.SubmissionId)).Should().BeNull();
        (await repository.ListArchitectureLinksByAssessmentInScopeAsync(scope, assessment)).Should().BeEmpty();
        (await repository.ListArchitectureLinksByControlInScopeAsync(scope, assessment, control)).Should().BeEmpty();
    }
}
