using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackProofPackageContractMarkdownTests
{
    [Fact]
    public void Proof_package_section_when_sendability_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                ProofSendability = "Send|able",
                PublishingTier = "Partial",
                EvidenceCompleteness = "Strong",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Proof sendability (API mirror) | `Send\\|able` · `Partial` · `Strong` |");
    }

    [Fact]
    public void Proof_package_section_when_evidence_completeness_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                ProofSendability = "Sendable",
                PublishingTier = "Partial",
                EvidenceCompleteness = "Strong`mirror",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``Strong`mirror``");
    }

    [Fact]
    public void Proof_package_section_when_evidence_completeness_contains_pipe_wraps_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                ProofSendability = "Sendable",
                PublishingTier = "Partial",
                EvidenceCompleteness = "Strong|partial",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`Strong\\|partial`");
    }

    [Fact]
    public void Proof_package_section_when_llm_count_resolved_wraps_count_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas { LlmCallCount = 3, LlmCallCountResolved = true },
            new ProofPackageCompletenessResponse
            {
                LlmCallCountResolved = true,
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM-call count |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`3` row(s)");
        row.Should().NotContain(PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain);
    }

    [Fact]
    public void Proof_package_section_when_llm_count_zero_resolved_discloses_shared_simulator_caveat()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas { LlmCallCount = 0, LlmCallCountResolved = true },
            new ProofPackageCompletenessResponse
            {
                LlmCallCountResolved = true,
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM-call count |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain);
    }

    [Fact]
    public void Proof_package_section_when_redaction_profile_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                BuyerSafeRedactionProfile = "tenant`segmented",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Buyer-safe redaction profile |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``tenant`segmented``");
    }

    [Fact]
    public void Proof_package_section_when_roi_confidence_label_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
                RoiConfidenceLabel = "Strong`tenant",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ROI evidence confidence |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``Strong`tenant``");
    }

    [Fact]
    public void Proof_package_section_when_roi_baseline_inputs_present_wraps_summary_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                RoiBaselineInputs = new PilotRoiBaselineInputsStatusResponse
                {
                    ReviewCycleHoursBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    ProjectedDollarClaimsSponsorSafe = true,
                },
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ROI baseline inputs (per field) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`review-cycle hours: buyer-provided");
    }

    [Fact]
    public void Proof_package_evidence_chain_cell_when_chain_missing_matches_trace_section_prose()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingTitle = "Gap",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = null,
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder traceSb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(traceSb, deltas);

        string prose = PilotTopFindingEvidenceChainHonestyCopy.UnavailableProse;
        proofSb.ToString().Should().Contain(prose);
        traceSb.ToString().Should().Contain(prose);
        proofSb.ToString().Should().NotContain("Explicitly unavailable — persisted finding");
    }

    [Fact]
    public void Proof_package_evidence_chain_cell_when_no_top_finding_uses_shared_skip_prose()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas { TopFindingId = null },
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Top finding evidence-chain pointer |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotTopFindingEvidenceChainHonestyCopy.NoFindingsSkipPlain);
        row.Should().NotContain("Not applicable — no findings on this run.");
    }
}
