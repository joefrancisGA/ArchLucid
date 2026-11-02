using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class FirstValueReportSponsorStatusRoiBasisStaleFallbackTests
{
    [Fact]
    public void Sponsor_status_roi_basis_when_stale_fallback_copy_uses_roi_claim_gate_narrative_not_proof()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
            RoiConfidenceLabel = "Strong",
            RoiBaselineInputs = new PilotRoiBaselineInputsStatusResponse
            {
                SponsorSafeFallbackCopy = "Stale pass — safe to quote projected savings.",
                ProjectedDollarClaimsSponsorSafe = true,
            },
        };

        var roiClaimGate = new SponsorRoiClaimDispositionResult(
            SponsorRoiClaimDisposition.Hold,
            PilotRoiEvidenceConfidence.Low,
            "review-cycle baseline: No measurement yet",
            false,
            "HOLD — collect baselines.",
            "Live gate narrative — do not quote savings.");

        StringBuilder sb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            proof,
            new PilotRunDeltas(),
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed },
            roiClaimGate);

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ROI basis status |", StringComparison.Ordinal));

        row.Should().Contain("Live gate narrative");
        row.Should().NotContain("Stale pass");
    }
}
