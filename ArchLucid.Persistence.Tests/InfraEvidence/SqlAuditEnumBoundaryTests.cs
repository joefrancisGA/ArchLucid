using ArchLucid.Contracts.Findings;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class SqlAuditEnumBoundaryTests
{
    [Theory]
    [InlineData(null, 0, "ReviewStatus")]
    [InlineData(3, 0, "ReviewStatus")]
    [InlineData(1, null, "ProvenanceKind")]
    [InlineData(1, -1, "ProvenanceKind")]
    public void Manual_review_requires_explicit_valid_authority_and_provenance(int? review, int? provenance, string field)
    {
        Assert.Contains(field, Assert.Throws<InvalidDataException>(() => SqlAuditManualEvidenceRepository.MapSubmission(
            new() { ReviewStatus = review, ProvenanceKind = provenance })).Message);
    }

    [Theory]
    [InlineData(null, 0, "CollectionStatus")]
    [InlineData(3, 0, "CollectionStatus")]
    [InlineData(0, null, "ProvenanceKind")]
    [InlineData(0, 5, "ProvenanceKind")]
    public void Evaluated_evidence_cannot_invent_collection_or_observation(int? collection, int? provenance, string field)
    {
        Assert.Contains(field, Assert.Throws<InvalidDataException>(() => SqlAuditControlEvaluationRepository.MapEvidenceItem(
            new() { CollectionStatus = collection, ProvenanceKind = provenance })).Message);
    }

    [Theory]
    [InlineData(null, 0, "Outcome")]
    [InlineData(-1, 0, "Outcome")]
    [InlineData(1, null, "ProvenanceKind")]
    [InlineData(1, 5, "ProvenanceKind")]
    public void Control_evaluation_requires_valid_outcome_and_provenance(int? outcome, int? provenance, string field)
    {
        Assert.Contains(field, Assert.Throws<InvalidDataException>(() => SqlAuditControlEvaluationRepository.Map(
            new() { Outcome = outcome, ProvenanceKind = provenance })).Message);
    }

    [Theory]
    [InlineData(null, 0, 0, "CollectionStatus")]
    [InlineData(3, 0, 0, "CollectionStatus")]
    [InlineData(0, null, 0, "FreshnessStatus")]
    [InlineData(0, 6, 0, "FreshnessStatus")]
    [InlineData(0, 0, null, "ProvenanceKind")]
    [InlineData(0, 0, 5, "ProvenanceKind")]
    public void Snapshot_evidence_requires_valid_capture_freshness_and_provenance(
        int? collection, int? freshness, int? provenance, string field)
    {
        Assert.Contains(field, Assert.Throws<InvalidDataException>(() => SqlAuditEvidenceSnapshotRepository.MapItem(
            new() { CollectionStatus = collection, FreshnessStatus = freshness, ProvenanceKind = provenance })).Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(4)]
    [InlineData(255)]
    public void Verification_cannot_invent_materialized_status(int? ordinal)
    {
        byte? stored = ordinal.HasValue ? checked((byte)ordinal.Value) : null;
        Assert.Throws<InvalidDataException>(() => SqlFindingVerificationReportRepository.MapResult(new() { Status = stored }));
    }

    [Fact]
    public void Explicit_historical_zero_and_nonzero_evidence_values_keep_their_meaning()
    {
        var submission = SqlAuditManualEvidenceRepository.MapSubmission(new() { ReviewStatus = 1, ProvenanceKind = 4 });
        Assert.Equal(AuditEvidenceReviewStatus.Approved, submission.ReviewStatus);
        Assert.Equal(ProvenanceKind.HumanAssertion, submission.ProvenanceKind);

        var item = SqlAuditControlEvaluationRepository.MapEvidenceItem(new() { CollectionStatus = 0, ProvenanceKind = 0 });
        Assert.Equal(AuditEvidenceCollectionStatus.Collected, item.CollectionStatus);
        Assert.Equal(ProvenanceKind.ObservedFact, item.ProvenanceKind);
        var outcome = SqlAuditControlEvaluationRepository.Map(new() { Outcome = 1, ProvenanceKind = 2 });
        Assert.Equal(AuditEvaluationOutcome.TechnicallySupported, outcome.Outcome);
        Assert.Equal(ProvenanceKind.DeterministicInference, outcome.ProvenanceKind);

        var snapshot = SqlAuditEvidenceSnapshotRepository.MapItem(new() { CollectionStatus = 1, FreshnessStatus = 5, ProvenanceKind = 1 });
        Assert.Equal(AuditEvidenceCollectionStatus.Insufficient, snapshot.CollectionStatus);
        Assert.Equal(AuditEvidenceFreshnessStatus.Expired, snapshot.FreshnessStatus);
        Assert.Equal(ProvenanceKind.DerivedFact, snapshot.ProvenanceKind);

        Assert.Equal(FindingVerificationStatus.Materialized, SqlFindingVerificationReportRepository.MapResult(new() { Status = 0 }).Status);
        Assert.Equal(FindingVerificationStatus.NotVerifiable, SqlFindingVerificationReportRepository.MapResult(new() { Status = 3 }).Status);
    }
}
