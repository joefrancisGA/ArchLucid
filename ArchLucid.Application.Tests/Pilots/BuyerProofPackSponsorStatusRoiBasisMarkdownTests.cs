using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorStatusRoiBasisMarkdownTests
{
    [Fact]
    public void Sponsor_status_roi_basis_row_when_narrative_block_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse
            {
                RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Low,
                RoiConfidenceLabel = "Low",
                AgentOutputPilotStrictEvidenceSatisfied = true,
            },
            new PilotRunDeltas(),
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold`pending baseline"));

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("ROI basis status", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``Hold`pending baseline``");
    }

    [Fact]
    public void Sponsor_status_roi_basis_row_when_confidence_label_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse
            {
                RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Low,
                RoiConfidenceLabel = "Low|estimate",
                AgentOutputPilotStrictEvidenceSatisfied = true,
            },
            new PilotRunDeltas(),
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold narrative"));

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("ROI basis status", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`Low\\|estimate`");
    }

    [Fact]
    public void Sponsor_status_evidence_source_row_when_redaction_profile_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.Sendable,
            new ProofPackageCompletenessResponse
            {
                BuyerSafeRedactionProfile = "tenant`segmented",
                AgentOutputPilotStrictEvidenceSatisfied = true,
                AuditRowCountResolved = true,
                LlmCallCountResolved = true,
            },
            new PilotRunDeltas(),
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Pass,
                PilotRoiEvidenceConfidence.Strong,
                "",
                true,
                "Pass",
                "Pass narrative"));

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Evidence source |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``tenant`segmented``");
    }

    [Fact]
    public void Sponsor_status_llm_call_basis_when_zero_resolved_discloses_shared_simulator_caveat()
    {
        StringBuilder sb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.Sendable,
            new ProofPackageCompletenessResponse
            {
                LlmCallCountResolved = true,
                AgentOutputPilotStrictEvidenceSatisfied = true,
            },
            new PilotRunDeltas { LlmCallCount = 0, LlmCallCountResolved = true },
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Pass,
                PilotRoiEvidenceConfidence.Strong,
                "",
                true,
                "Pass",
                "Pass narrative"));

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM call basis |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain);
    }

    [Fact]
    public void Sponsor_status_roi_claim_gate_row_when_lead_line_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse(),
            new PilotRunDeltas(),
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold`review baseline",
                "Hold narrative"));

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ROI claim gate |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``Hold`review baseline``");
    }
}
