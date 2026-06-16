using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TopFindingEvidenceSufficiencyClassifierTests
{
    [Fact]
    public void Classify_NoTopFinding_ReturnsNull()
    {
        TopFindingEvidenceSufficiency? result = TopFindingEvidenceSufficiencyClassifier.Classify(
            new PilotRunDeltas(),
            MinimalProof(),
            new ArchitectureRun());

        result.Should().BeNull();
    }

    [Fact]
    public void Classify_MissingChain_ReturnsInsufficient()
    {
        TopFindingEvidenceSufficiency? result = TopFindingEvidenceSufficiencyClassifier.Classify(
            new PilotRunDeltas { TopFindingId = "f-1", TopFindingSeverity = "Error" },
            MinimalProof(),
            new ArchitectureRun());

        result.Should().Be(TopFindingEvidenceSufficiency.Insufficient);
        TopFindingEvidenceSufficiencyClassifier.DescribeForMarkdownTable(result)
            .Should()
            .Contain("Insufficient");
    }

    [Fact]
    public void Classify_StrongChain_ReturnsSufficient()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse { ManifestVersion = "v1" },
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = false,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        TopFindingEvidenceSufficiency? result = TopFindingEvidenceSufficiencyClassifier.Classify(
            deltas,
            proof,
            new ArchitectureRun { RealModeFellBackToSimulator = false });

        result.Should().Be(TopFindingEvidenceSufficiency.Sufficient);
        TopFindingEvidenceSufficiencyClassifier.DescribeConfidenceClass(result)
            .Should()
            .Be("sponsor-review-ready");
    }

    [Fact]
    public void Classify_DemoDerived_ReturnsLow_NotDefinitiveLabelRequiredInCard()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-2",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse(),
            IsDemoTenant = true,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            DemoTenantWarningRequired = true,
            AgentOutputPilotStrictEvidenceSatisfied = true,
        };

        TopFindingEvidenceSufficiency? result = TopFindingEvidenceSufficiencyClassifier.Classify(
            deltas,
            proof,
            new ArchitectureRun());

        result.Should().Be(TopFindingEvidenceSufficiency.Low);

        StringBuilder sb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        sb.ToString().Should().Contain("**Not definitive**");
        sb.ToString().Should().Contain("manual-review-required");
    }

    private static ProofPackageCompletenessResponse MinimalProof() =>
        new()
        {
            ProofSendability = "SendableWithCaveats",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Incomplete),
        };
}
