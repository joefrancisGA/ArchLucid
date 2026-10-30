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
}
