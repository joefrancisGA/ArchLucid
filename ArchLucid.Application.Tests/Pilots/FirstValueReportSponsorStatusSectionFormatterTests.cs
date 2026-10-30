using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class FirstValueReportSponsorStatusSectionFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_labels_missing_redaction_profile_and_finding_severity()
    {
        StringBuilder sb = new();
        ArchitectureRunDetail detail = new()
        {
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            Message = "",
                            Category = "",
                            Severity = FindingSeverity.Info,
                        },
                    ],
                },
            ],
        };

        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            detail,
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse
            {
                BuyerSafeRedactionProfile = "",
                AgentOutputPilotStrictEvidenceSatisfied = false,
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

        string markdown = sb.ToString();

        markdown.Should().Contain("redaction profile was not stored.");
        markdown.Should().Contain("Finding category was not stored.");
    }

    [Fact]
    public void AppendMarkdownSection_when_audit_row_count_unresolved_emits_not_attested_audit_basis_row()
    {
        StringBuilder sb = new();

        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse
            {
                AuditRowCountResolved = false,
                LlmCallCountResolved = true,
            },
            new PilotRunDeltas { AuditRowCount = 0, AuditRowCountResolved = false },
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold narrative"));

        string markdown = sb.ToString();

        markdown.Should().Contain("| Audit row basis | **Not attested**");
        markdown.Should().NotContain("| Audit row basis | **0**");
    }

    [Fact]
    public void AppendMarkdownSection_when_audit_row_count_truncated_discloses_cap_on_first_page()
    {
        StringBuilder sb = new();

        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.Sendable,
            new ProofPackageCompletenessResponse
            {
                AuditRowCountResolved = true,
                AgentOutputPilotStrictEvidenceSatisfied = true,
            },
            new PilotRunDeltas
            {
                AuditRowCount = 500,
                AuditRowCountResolved = true,
                AuditRowCountTruncated = true,
            },
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Pass,
                PilotRoiEvidenceConfidence.Strong,
                "",
                true,
                "Pass",
                "Pass narrative"));

        sb.ToString().Should().Contain("| Audit row basis | **500+**");
    }

    [Fact]
    public void AppendMarkdownSection_when_roi_narrative_block_contains_pipe_escapes_roi_basis_row()
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
                "Hold|pending baseline"));

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("ROI basis status", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("Hold\\|pending baseline");
    }

    [Fact]
    public void AppendMarkdownSection_when_roi_claim_gate_lead_line_contains_pipe_escapes_table_cell()
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
                "Hold|review baseline",
                "Hold narrative"));

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("ROI claim gate", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| ROI claim gate | Hold\\|review baseline |");
    }
}
