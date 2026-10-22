using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Posture;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceProductBridgeTests
{
    [Fact]
    public void ToFindings_maps_severity_title_and_provenance_properties()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-1",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "No trust boundary element exists.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
            Confidence = 0.7,
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = 0.7,
            },
        };

        List<Finding> findings = ArchitectureIntelligenceProductBridge.ToFindings([finding]);

        findings.Should().ContainSingle();
        findings[0].Severity.Should().Be(FindingSeverity.Error);
        findings[0].Title.Should().Be(finding.Title);
        findings[0].QualityDimension.Should().Be(
            ArchitecturePillarRollup.ToStorageKey(ArchitecturePillarRollup.FromSpecialistDimension(QualityDimension.Security)));
        findings[0].Properties.Should().ContainKey("architectureIntelligence.provenance");
        findings[0].Properties.Should().ContainKey("architectureIntelligence.provenancePresentation");
        findings[0].Properties["architectureIntelligence.provenancePresentation"]
            .Should().Be(ProvenancePresentationBucket.Unverified.ToString());
    }

    [Fact]
    public void ToHypothesisLaneFindings_maps_adversarial_challenges_to_info_lane_findings()
    {
        AdversarialChallenge challenge = new()
        {
            ChallengeId = "challenge-1",
            SourceFindingId = "finding-9",
            Hypothesis = "Challenge finding: failover may be overstated",
            FalsificationEvidenceNeeded = "Inventory-backed recovery tier evidence",
            Lane = AdversarialLane.AdversarialChallenge,
            Confidence = 0.4,
        };

        List<Finding> findings = ArchitectureIntelligenceProductBridge.ToHypothesisLaneFindings([challenge]);

        findings.Should().ContainSingle();
        findings[0].Severity.Should().Be(FindingSeverity.Info);
        findings[0].FindingType.Should().Be("ArchitectureIntelligence.AdversarialChallenge");
        findings[0].Properties["architectureIntelligence.adversarialLane"]
            .Should().Be(AdversarialLane.AdversarialChallenge.ToString());
        findings[0].Properties["architectureIntelligence.provenancePresentation"]
            .Should().Be(ProvenancePresentationBucket.Hypothesis.ToString());
    }

    [Fact]
    public void ToRecommendationRecords_maps_proposed_status_and_supporting_findings()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-42",
            Dimension = QualityDimension.Security,
            Title = "Missing trust boundary",
            Rationale = "Gap detected",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = Guid.NewGuid().ToString("N"),
            Problem = "Missing trust boundary",
            Evidence = "Gap detected",
            AffectedRequirementOrQualityAttribute = "Security",
            ProposedChange = "Address finding: Missing trust boundary",
            ConsequenceOfInaction = "Risk remains",
            ValidationMethod = "Re-run review",
            Effort = new EffortEstimate { Band = "Medium" },
            RiskReduction = new RiskReductionEstimate { Level = "High" },
        };

        List<RecommendationRecord> records = ArchitectureIntelligenceProductBridge.ToRecommendationRecords(
            [recommendation],
            [finding],
            tenantId: Guid.NewGuid().ToString(),
            workspaceId: Guid.NewGuid().ToString(),
            projectId: Guid.NewGuid().ToString(),
            runId: Guid.NewGuid().ToString());

        records.Should().ContainSingle();
        records[0].Status.Should().Be(RecommendationStatus.Proposed);
        records[0].SupportingFindingIdsJson.Should().Contain("finding-42");
    }
}
