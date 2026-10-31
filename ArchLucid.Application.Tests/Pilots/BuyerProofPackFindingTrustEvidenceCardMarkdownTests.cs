using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackFindingTrustEvidenceCardMarkdownTests
{
    [Fact]
    public void Evidence_card_when_manifest_version_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-pipe",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse { ManifestVersion = "v2|beta" },
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, MinimalProof());

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Manifest version (chain) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Manifest version (chain) | `v2\\|beta` |");
    }

    [Fact]
    public void Evidence_card_when_unrecognized_readiness_matches_proof_package_unresolved_copy()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Warning",
        };

        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = "Sendable",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = "tier`broken",
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun
            {
                RunId = "r1",
                Status = ArchitectureRunStatus.Committed,
            });

        string prose = PilotSponsorProofReadinessUnresolvedHonestyCopy.UnresolvedPlain;
        sb.ToString().Should().Contain(prose);
        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Sponsor-proof readiness (classification) |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }

    [Fact]
    public void Evidence_card_when_chain_missing_uses_shared_unavailable_prose()
    {
        StringBuilder sb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingSeverity = "Error",
                TopFindingEvidenceChain = null,
            },
            MinimalProof());

        string md = sb.ToString();
        md.Should().Contain(PilotTopFindingEvidenceChainHonestyCopy.UnavailableProse);
        md.Should().NotContain("did not resolve to a persisted chain");
    }

    [Fact]
    public void Evidence_card_when_no_top_finding_aligns_with_trace_section_skip_prose()
    {
        PilotRunDeltas deltas = new() { TopFindingId = null };

        StringBuilder traceSb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(traceSb, deltas);

        StringBuilder cardSb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(cardSb, deltas, MinimalProof());

        string prose = PilotTopFindingEvidenceChainHonestyCopy.NoFindingsSkipPlain;
        traceSb.ToString().Should().Contain(prose);
        cardSb.ToString().Should().Contain(prose);
        cardSb.ToString().Should().NotContain("no top-severity evidence card");
    }

    [Fact]
    public void Evidence_card_when_severity_empty_uses_not_stored_copy()
    {
        StringBuilder sb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingTitle = "Gap",
                TopFindingSeverity = "",
            },
            MinimalProof());

        sb.ToString().Should().Contain(PilotTopFindingPresentationHonestyCopy.SeverityNotStored);
    }

    [Fact]
    public void Evidence_card_sendability_row_matches_proof_package_mirror_when_sendable()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Error",
        };

        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = nameof(ProofPackageSendability.Sendable),
            PublishingTier = "Complete",
            EvidenceCompleteness = "Strong",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Sendable),
        };

        StringBuilder cardSb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(cardSb, deltas, proof);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string expected =
            PilotSponsorSafeSendableAllClearHonestyCopy.FormatProofSendabilityMirrorCell(proof);

        cardSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Buyer-safe proof sendability (API checklist) |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);
    }

    [Fact]
    public void Evidence_card_pilot_strict_row_matches_proof_package_posture_row_when_failed()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Error",
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = true,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = false,
            ProofSendability = "NotSendable",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Incomplete),
        };

        StringBuilder cardSb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(cardSb, deltas, proof);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string prose = PilotAgentOutputPilotStrictHonestyCopy.FailedPlain;

        cardSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Agent output quality (PilotStrict, when attested) |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| PilotStrict agent-output posture |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }

    [Fact]
    public void Evidence_card_pilot_strict_row_matches_proof_package_posture_row_when_satisfied()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Warning",
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = false,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            ProofSendability = nameof(ProofPackageSendability.Sendable),
            PublishingTier = "Complete",
            EvidenceCompleteness = "Strong",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Sendable),
        };

        StringBuilder cardSb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(cardSb, deltas, proof);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string prose = PilotAgentOutputPilotStrictHonestyCopy.SatisfiedPlain;

        cardSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Agent output quality (PilotStrict, when attested) |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| PilotStrict agent-output posture |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }

    [Fact]
    public void Evidence_card_evidence_basis_row_matches_proof_package_when_simulator_substitution()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Error",
        };

        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = nameof(ProofPackageSendability.SendableWithCaveats),
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Incomplete),
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        ArchitectureRun run = new()
        {
            RunId = "r1",
            Status = ArchitectureRunStatus.Committed,
            RealModeFellBackToSimulator = true,
        };

        StringBuilder cardSb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(cardSb, deltas, proof, run);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            run);

        string prose = PilotSimulatorSubstitutionHonestyCopy.ConcreteGapPlain;

        string proofRow = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Evidence-basis labels |", StringComparison.Ordinal));

        cardSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Evidence-basis label (top finding) |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);

        proofRow.Should().Contain(prose);
    }

    [Fact]
    public void Evidence_card_evidence_basis_when_pilot_strict_failed_uses_deltas_not_stale_proof_flag()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse(),
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = true,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        StringBuilder cardSb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(cardSb, deltas, proof, new ArchitectureRun());

        cardSb.ToString()
            .Should()
            .Contain("| Evidence-basis label (top finding) | **Low support**");

        cardSb.ToString()
            .Should()
            .Contain("| Evidence sufficiency (top finding) | **Low**");
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
