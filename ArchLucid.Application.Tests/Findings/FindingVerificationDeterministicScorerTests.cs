using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingVerificationDeterministicScorerTests
{
    private readonly FindingVerificationDeterministicScorer _scorer = new();

    [Fact]
    public void Score_without_verification_snapshot_id_returns_not_verifiable_rv001()
    {
        Finding finding = BuildFinding();

        (FindingVerificationStatus status, string trace) = _scorer.Score(
            finding,
            new FindingVerificationScoringContext());

        status.Should().Be(FindingVerificationStatus.NotVerifiable);
        trace.Should().Contain("RV-001");
    }

    [Fact]
    public void Score_without_concrete_evidence_refs_returns_not_verifiable_rv002()
    {
        Finding finding = BuildFinding(evidenceRefs: ["graph-node:abc"]);

        (FindingVerificationStatus status, string trace) = _scorer.Score(
            finding,
            new FindingVerificationScoringContext
            {
                VerificationFindingsSnapshotId = Guid.NewGuid(),
                VerificationSnapshot = new FindingsSnapshot(),
            });

        status.Should().Be(FindingVerificationStatus.NotVerifiable);
        trace.Should().Contain("RV-002");
    }

    [Fact]
    public void Score_with_correlation_match_returns_materialized_rv003()
    {
        Finding finding = BuildFinding();

        (FindingVerificationStatus status, string trace) = _scorer.Score(
            finding,
            new FindingVerificationScoringContext
            {
                VerificationFindingsSnapshotId = Guid.NewGuid(),
                VerificationSnapshot = new FindingsSnapshot(),
                Correlation = new CrossReviewFindingCorrelationResult
                {
                    MatchedPairs =
                    [
                        new FindingCorrelationPair
                        {
                            LeftFindingId = finding.FindingId,
                            RightFindingId = "later-finding",
                            Method = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                        },
                    ],
                },
            });

        status.Should().Be(FindingVerificationStatus.Materialized);
        trace.Should().Contain("RV-003");
    }

    [Fact]
    public void Score_with_remediated_disposition_returns_mitigated_rv004()
    {
        Finding finding = BuildFinding();

        (FindingVerificationStatus status, string trace) = _scorer.Score(
            finding,
            new FindingVerificationScoringContext
            {
                VerificationFindingsSnapshotId = Guid.NewGuid(),
                VerificationSnapshot = new FindingsSnapshot(),
                Dispositions = new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase)
                {
                    [finding.FindingId] = FindingDisposition.Remediated,
                },
            });

        status.Should().Be(FindingVerificationStatus.Mitigated);
        trace.Should().Contain("RV-004");
    }

    [Fact]
    public void Score_when_unmatched_and_covered_returns_not_observed_rv005()
    {
        string evidenceRef = "arm:/subscriptions/demo/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/demo";
        Finding finding = BuildFinding(evidenceRefs: [evidenceRef]);

        (FindingVerificationStatus status, string trace) = _scorer.Score(
            finding,
            new FindingVerificationScoringContext
            {
                VerificationFindingsSnapshotId = Guid.NewGuid(),
                VerificationSnapshot = new FindingsSnapshot
                {
                    Findings =
                    [
                        new Finding
                        {
                            FindingId = "other-finding",
                            EvidenceRefs = [evidenceRef],
                        },
                    ],
                },
            });

        status.Should().Be(FindingVerificationStatus.NotObserved);
        trace.Should().Contain("RV-005");
    }

    private static Finding BuildFinding(IReadOnlyList<string>? evidenceRefs = null) =>
        new()
        {
            FindingId = "finding-verification-1",
            Title = "Public storage exposure",
            Category = "Storage",
            EngineType = "Topology",
            Severity = FindingSeverity.Critical,
            PolicyRuleId = "rule-storage-public",
            EvidenceRefs = evidenceRefs?.ToList()
                ?? ["arm:/subscriptions/demo/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/demo"],
        };
}
