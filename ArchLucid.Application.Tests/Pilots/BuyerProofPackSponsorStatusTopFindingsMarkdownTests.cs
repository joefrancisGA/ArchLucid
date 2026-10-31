using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorStatusTopFindingsMarkdownTests
{
    [Fact]
    public void Sponsor_status_top_findings_row_when_message_contains_backtick_preserves_inline_code()
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
                            FindingId = "f-1",
                            Message = "Gap`title",
                            Severity = FindingSeverity.Error,
                        },
                    ],
                },
            ],
        };

        AppendMinimalSection(sb, detail);

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Top findings |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("Error: ``Gap`title``");
    }

    [Fact]
    public void Sponsor_status_top_findings_row_when_message_contains_newline_collapses_table_cell()
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
                            FindingId = "f-1",
                            Message = "Gap\n-evil",
                            Severity = FindingSeverity.Error,
                        },
                    ],
                },
            ],
        };

        AppendMinimalSection(sb, detail);

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Top findings |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`Gap -evil`");
        row.Should().NotContain("\n-evil");
    }

    [Fact]
    public void Sponsor_status_next_action_when_stale_proof_demo_flag_but_not_demo_on_deltas_uses_caveats_not_walkthrough()
    {
        StringBuilder sb = new();

        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse
            {
                DemoTenantWarningRequired = true,
                AgentOutputPilotStrictEvidenceSatisfied = true,
            },
            new PilotRunDeltas
            {
                IsDemoTenant = false,
                AgentOutputPilotStrictSignalsResolved = true,
                AgentOutputPilotStrictViolatesSponsorEvidence = false,
            },
            new ArchitectureRun { RealModeFellBackToSimulator = false },
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Warn,
                PilotRoiEvidenceConfidence.Partial,
                "",
                false,
                "WARN",
                "WARN narrative"));

        sb.ToString()
            .Should()
            .Contain("| Recommended next action | Review caveats, collect missing ROI/evidence fields, then regenerate the packet. |");
        sb.ToString()
            .Should()
            .NotContain("Use this only as a demo walkthrough");
    }

    [Fact]
    public void Sponsor_status_next_action_when_pilot_strict_failed_uses_deltas_not_stale_proof_flag()
    {
        StringBuilder sb = new();

        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            new ProofPackageCompletenessResponse { AgentOutputPilotStrictEvidenceSatisfied = true },
            new PilotRunDeltas
            {
                AgentOutputPilotStrictSignalsResolved = true,
                AgentOutputPilotStrictViolatesSponsorEvidence = true,
            },
            new ArchitectureRun(),
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Strong,
                "",
                false,
                "Hold",
                "Hold narrative"));

        sb.ToString()
            .Should()
            .Contain("| Recommended next action | Hold sponsor send; resolve AI quality/simulator disclosure before forwarding. |");
    }

    [Fact]
    public void Sponsor_pdf_gate_blocks_when_roi_baseline_inputs_null_and_not_demo()
    {
        FirstValueReportBuildResult built = new(
            Markdown: "# report",
            EvidenceCompleteness: FirstValueEvidenceCompletenessLevel.Strong,
            SponsorProofReadiness: SponsorProofReadinessClassification.Sendable,
            ProofPackageCompleteness: new ProofPackageCompletenessResponse
            {
                DemoTenantWarningRequired = false,
                AgentOutputPilotStrictEvidenceSatisfied = true,
                RoiBaselineInputs = null,
            });

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().Throw<SponsorFirstValuePdfBlockedException>()
            .WithMessage("*projected-dollar*");
    }

    [Fact]
    public void BuyerProofPack_sponsor_pdf_gate_blocks_pilot_strict_from_run_deltas_when_proof_stale()
    {
        FirstValueReportBuildResult built = new(
            Markdown: "# report",
            EvidenceCompleteness: FirstValueEvidenceCompletenessLevel.Strong,
            SponsorProofReadiness: SponsorProofReadinessClassification.Sendable,
            ProofPackageCompleteness: new ProofPackageCompletenessResponse
            {
                AgentOutputPilotStrictEvidenceSatisfied = true,
                RoiBaselineInputs = new PilotRoiBaselineInputsStatusResponse { ProjectedDollarClaimsSponsorSafe = true },
            },
            PilotRunDeltas: new PilotRunDeltas
            {
                AgentOutputPilotStrictSignalsResolved = true,
                AgentOutputPilotStrictViolatesSponsorEvidence = true,
            });

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().Throw<SponsorFirstValuePdfBlockedException>()
            .WithMessage("*PilotStrict*");
    }

    [Fact]
    public void BuyerProofPack_sponsor_pdf_gate_blocks_projected_dollar_from_roi_claim_gate_when_stale_proof_inputs_safe()
    {
        var roiClaimGate = new SponsorRoiClaimDispositionResult(
            SponsorRoiClaimDisposition.Warn,
            PilotRoiEvidenceConfidence.Partial,
            "review-cycle baseline: Defaulted from ROI model options",
            false,
            "WARN",
            "WARN narrative");

        FirstValueReportBuildResult built = new(
            Markdown: "# report",
            EvidenceCompleteness: FirstValueEvidenceCompletenessLevel.Strong,
            SponsorProofReadiness: SponsorProofReadinessClassification.Sendable,
            ProofPackageCompleteness: new ProofPackageCompletenessResponse
            {
                DemoTenantWarningRequired = false,
                AgentOutputPilotStrictEvidenceSatisfied = true,
                RoiBaselineInputs = new PilotRoiBaselineInputsStatusResponse
                {
                    ProjectedDollarClaimsSponsorSafe = true,
                },
            },
            RoiClaimGate: roiClaimGate);

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().Throw<SponsorFirstValuePdfBlockedException>()
            .WithMessage("*projected-dollar*");
    }

    private static void AppendMinimalSection(StringBuilder sb, ArchitectureRunDetail detail) =>
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            detail,
            SponsorSafeProofDisposition.Sendable,
            new ProofPackageCompletenessResponse
            {
                AgentOutputPilotStrictEvidenceSatisfied = true,
                AuditRowCountResolved = true,
                LlmCallCountResolved = true,
            },
            new PilotRunDeltas(),
            new ArchitectureRun { Status = ArchitectureRunStatus.Committed },
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Pass,
                PilotRoiEvidenceConfidence.Strong,
                "",
                true,
                "Pass",
                "Pass narrative"));
}
