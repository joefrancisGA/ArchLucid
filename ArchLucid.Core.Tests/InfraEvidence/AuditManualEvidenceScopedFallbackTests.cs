using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuditManualEvidenceScopedFallbackTests
{
    // Six scope permutations x seven scoped operations = 42 fail-closed assertions.
    // A legacy implementation exposes tenant-only methods that could return private data;
    // none of those methods may be called through the project-scoped interface defaults.
    [Fact]
    public void Legacy_implementation_cannot_serve_project_scoped_reads_or_writes()
    {
        LegacyTenantOnlyRepository repository = new();
        IAuditManualEvidenceRepository scoped = repository;
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        Guid assessment = Guid.NewGuid();
        Guid submission = Guid.NewGuid();
        Guid control = Guid.NewGuid();
        Guid requirement = Guid.NewGuid();
        ProjectScopeKey[] scopes =
        [
            ProjectScopeKey.Create(tenant, workspace, project),
            ProjectScopeKey.Create(tenant, workspace, Guid.NewGuid()),
            ProjectScopeKey.Create(tenant, Guid.NewGuid(), project),
            ProjectScopeKey.Create(Guid.NewGuid(), workspace, project),
            ProjectScopeKey.Create(tenant, Guid.NewGuid(), Guid.NewGuid()),
            ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()),
        ];
        foreach (ProjectScopeKey scope in scopes)
        {
            AuditManualEvidenceSubmissionMutation mutation = new()
            {
                SubmissionId = submission, AssessmentId = assessment, ControlId = control,
                RequirementId = requirement, SubmittedBy = "test", SubmittedUtc = DateTime.UtcNow,
                BlobPointer = "test://evidence",
                EvidenceHashSha256 = new byte[32],
                ReviewStatus = AuditEvidenceReviewStatus.Pending,
                ProvenanceKind = ProvenanceKind.HumanAssertion,
            };
            AuditArchitectureEvidenceLinkRecord link = new()
            {
                LinkId = Guid.NewGuid(), TenantId = scope.TenantId, AssessmentId = assessment,
                ControlId = control, RequirementId = requirement, RunId = Guid.NewGuid(),
                GoldenManifestId = Guid.NewGuid(), LinkedBy = "test", LinkedUtc = DateTime.UtcNow,
            };
            Action[] calls =
            [
                () => _ = scoped.InsertSubmissionInScopeAsync(scope, mutation),
                () => _ = scoped.ListByAssessmentInScopeAsync(scope, assessment),
                () => _ = scoped.ListByControlInScopeAsync(scope, assessment, control),
                () => _ = scoped.TryGetByIdInScopeAsync(scope, submission),
                () => _ = scoped.InsertArchitectureLinkInScopeAsync(scope, link),
                () => _ = scoped.ListArchitectureLinksByAssessmentInScopeAsync(scope, assessment),
                () => _ = scoped.ListArchitectureLinksByControlInScopeAsync(scope, assessment, control),
            ];
            foreach (Action call in calls)
                call.Should().Throw<NotSupportedException>().WithMessage("*explicit scoped repository implementation*");
        }
        repository.UnscopedCalls.Should().Be(0, "scoped calls must never fall back to tenant-wide repository methods");
    }

    private sealed class LegacyTenantOnlyRepository : IAuditManualEvidenceRepository
    {
        public int UnscopedCalls { get; private set; }

        public Task InsertSubmissionAsync(AuditManualEvidenceSubmissionRecord item, CancellationToken token = default)
        {
            UnscopedCalls++;
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByAssessmentAsync(
            Guid tenantId, Guid assessmentId, CancellationToken token = default)
        {
            UnscopedCalls++;
            return Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>([]);
        }

        public Task<IReadOnlyList<AuditManualEvidenceSubmissionRecord>> ListByControlAsync(
            Guid tenantId, Guid assessmentId, Guid controlId, CancellationToken token = default)
        {
            UnscopedCalls++;
            return Task.FromResult<IReadOnlyList<AuditManualEvidenceSubmissionRecord>>([]);
        }

        public Task<AuditManualEvidenceSubmissionRecord?> TryGetByIdAsync(
            Guid tenantId, Guid submissionId, CancellationToken token = default)
        {
            UnscopedCalls++;
            return Task.FromResult<AuditManualEvidenceSubmissionRecord?>(null);
        }

        public Task InsertArchitectureLinkAsync(AuditArchitectureEvidenceLinkRecord item, CancellationToken token = default)
        {
            UnscopedCalls++;
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByAssessmentAsync(
            Guid tenantId, Guid assessmentId, CancellationToken token = default)
        {
            UnscopedCalls++;
            return Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>([]);
        }

        public Task<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>> ListArchitectureLinksByControlAsync(
            Guid tenantId, Guid assessmentId, Guid controlId, CancellationToken token = default)
        {
            UnscopedCalls++;
            return Task.FromResult<IReadOnlyList<AuditArchitectureEvidenceLinkRecord>>([]);
        }
    }
}
