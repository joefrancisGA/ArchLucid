using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuditManualEvidenceSubmissionMutationTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid SubmissionId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid AssessmentId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid ControlId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid RequirementId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly DateTime SubmittedUtc = new(2026, 9, 21, 1, 0, 0, DateTimeKind.Utc);
    private static readonly byte[] EvidenceHash = [1, 2, 3];

    [Fact]
    public void ToRecord_maps_null_owner_and_document_kind_to_empty_strings()
    {
        AuditManualEvidenceSubmissionMutation mutation = CreateMutation(
            owner: null,
            documentKind: null);

        AuditManualEvidenceSubmissionRecord record = mutation.ToRecord(TenantId);

        record.Owner.Should().BeEmpty();
        record.DocumentKind.Should().BeEmpty();
    }

    [Fact]
    public void ToRecord_preserves_supplied_owner_and_document_kind()
    {
        AuditManualEvidenceSubmissionMutation mutation = CreateMutation(
            owner: "security-team",
            documentKind: AuditManualEvidenceDocumentKind.Policy);

        AuditManualEvidenceSubmissionRecord record = mutation.ToRecord(TenantId);

        record.Owner.Should().Be("security-team");
        record.DocumentKind.Should().Be(AuditManualEvidenceDocumentKind.Policy);
    }

    [Fact]
    public void ToRecord_copies_scope_tenant_and_leaves_optional_fields_null()
    {
        AuditManualEvidenceSubmissionMutation mutation = CreateMutation(
            owner: "owner",
            documentKind: AuditManualEvidenceDocumentKind.Procedure);

        AuditManualEvidenceSubmissionRecord record = mutation.ToRecord(TenantId);

        record.SubmissionId.Should().Be(SubmissionId);
        record.TenantId.Should().Be(TenantId);
        record.AssessmentId.Should().Be(AssessmentId);
        record.ControlId.Should().Be(ControlId);
        record.RequirementId.Should().Be(RequirementId);
        record.SubmittedBy.Should().Be("reviewer@example.com");
        record.SubmittedUtc.Should().Be(SubmittedUtc);
        record.ApplicablePeriodStartUtc.Should().BeNull();
        record.ApplicablePeriodEndUtc.Should().BeNull();
        record.ExpirationUtc.Should().BeNull();
        record.DocumentVersion.Should().BeNull();
        record.EvidenceHashSha256.Should().Equal(EvidenceHash);
        record.BlobPointer.Should().Be("blob://manual-evidence");
        record.ReviewStatus.Should().Be(AuditEvidenceReviewStatus.Pending);
        record.ProvenanceKind.Should().Be(ProvenanceKind.HumanAssertion);
        record.ItsmProvider.Should().BeNull();
        record.ItsmExternalKey.Should().BeNull();
    }

    private static AuditManualEvidenceSubmissionMutation CreateMutation(
        string? owner,
        string? documentKind) =>
        new()
        {
            SubmissionId = SubmissionId,
            AssessmentId = AssessmentId,
            ControlId = ControlId,
            RequirementId = RequirementId,
            Owner = owner,
            SubmittedBy = "reviewer@example.com",
            SubmittedUtc = SubmittedUtc,
            EvidenceHashSha256 = EvidenceHash,
            BlobPointer = "blob://manual-evidence",
            ReviewStatus = AuditEvidenceReviewStatus.Pending,
            ProvenanceKind = ProvenanceKind.HumanAssertion,
            DocumentKind = documentKind,
        };
}
