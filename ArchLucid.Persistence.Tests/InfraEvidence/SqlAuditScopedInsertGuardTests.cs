using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlAuditScopedInsertGuardTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(16)]
    [InlineData(31)]
    [InlineData(33)]
    [InlineData(64)]
    public async Task Manual_evidence_requires_a_complete_sha256_hash_before_database_access(int length)
    {
        SqlAuditManualEvidenceRepository repository = new(null!);
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        AuditManualEvidenceSubmissionMutation mutation = new()
        {
            SubmissionId = Guid.NewGuid(), AssessmentId = Guid.NewGuid(),
            ControlId = Guid.NewGuid(), RequirementId = Guid.NewGuid(),
            SubmittedBy = "security-test", SubmittedUtc = DateTime.UtcNow,
            EvidenceHashSha256 = new byte[length], BlobPointer = "test://evidence",
            ReviewStatus = ArchLucid.Core.InfraEvidence.AuditEvidenceReviewStatus.Pending,
            ProvenanceKind = ArchLucid.Core.InfraEvidence.ProvenanceKind.HumanAssertion,
        };
        Func<Task> action = () => repository.InsertSubmissionInScopeAsync(scope, mutation);
        await action.Should().ThrowAsync<ArgumentException>().WithMessage("*exactly 32 bytes*");
    }

    [Fact]
    public async Task Architecture_link_rejects_foreign_tenant_before_opening_a_database_connection()
    {
        Guid tenant = Guid.NewGuid();
        ProjectScopeKey scope = ProjectScopeKey.Create(tenant, Guid.NewGuid(), Guid.NewGuid());
        // A null factory is intentional: rejecting mismatched authority must occur
        // before any SQL connection is attempted.
        SqlAuditManualEvidenceRepository repository = new(null!);
        AuditArchitectureEvidenceLinkRecord link = new()
        {
            LinkId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            AssessmentId = Guid.NewGuid(),
            ControlId = Guid.NewGuid(),
            RequirementId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(),
            LinkedBy = "boundary-test",
            LinkedUtc = DateTime.UtcNow,
        };
        Func<Task> action = () => repository.InsertArchitectureLinkInScopeAsync(scope, link);
        await action.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*foreign tenant authority*");
    }
}
