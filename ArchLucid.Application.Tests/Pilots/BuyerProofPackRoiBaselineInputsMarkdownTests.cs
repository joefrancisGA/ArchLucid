using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackRoiBaselineInputsMarkdownTests
{
    [Fact]
    public void Roi_baseline_section_when_fallback_copy_contains_newline_collapses_blockquote()
    {
        StringBuilder sb = new();
        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(
            sb,
            new PilotRoiBaselineInputsStatusResponse
            {
                ProjectedDollarClaimsSponsorSafe = false,
                SponsorSafeFallbackCopy = "Do not lead with savings.\n## Forged heading",
            });

        string md = sb.ToString();
        md.Should().Contain("> `Do not lead with savings. ## Forged heading`");
        md.Should().NotContain("\n> ## Forged heading");
    }

    [Fact]
    public void Roi_baseline_section_when_fallback_copy_contains_backtick_preserves_blockquote_inline_code()
    {
        StringBuilder sb = new();
        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(
            sb,
            new PilotRoiBaselineInputsStatusResponse
            {
                ProjectedDollarClaimsSponsorSafe = false,
                SponsorSafeFallbackCopy = "Hold`review baseline",
            });

        string md = sb.ToString();
        md.Should().Contain("> ``Hold`review baseline``");
    }

    [Fact]
    public void Roi_baseline_projected_dollar_row_matches_proof_package_contract_when_not_sponsor_safe()
    {
        PilotRoiBaselineInputsStatusResponse inputs = new()
        {
            ProjectedDollarClaimsSponsorSafe = false,
            SponsorSafeFallbackCopy = "Use qualitative ROI only.",
        };

        StringBuilder baselineSb = new();
        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(baselineSb, inputs);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                RoiBaselineInputs = inputs,
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun
            {
                RunId = "r1",
                Status = ArchitectureRunStatus.Committed,
            });

        string expected = PilotProjectedDollarClaimsSponsorSafeHonestyCopy.NoPlain;

        baselineSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Projected dollar claims sponsor-safe |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Projected dollar claims sponsor-safe |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);
    }

    [Fact]
    public void Roi_baseline_projected_dollar_when_stale_inputs_safe_but_roi_claim_gate_not_matches_proof_package()
    {
        PilotRoiBaselineInputsStatusResponse inputs = new()
        {
            ProjectedDollarClaimsSponsorSafe = true,
            SponsorSafeFallbackCopy = "Use qualitative ROI only.",
            ReviewCycleHoursBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.BuyerProvided,
        };

        var roiClaimGate = new SponsorRoiClaimDispositionResult(
            SponsorRoiClaimDisposition.Warn,
            PilotRoiEvidenceConfidence.Partial,
            "review-cycle baseline: Defaulted from ROI model options",
            false,
            "WARN",
            "WARN narrative");

        StringBuilder baselineSb = new();
        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(baselineSb, inputs, roiClaimGate);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                RoiBaselineInputs = inputs,
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed },
            roiClaimGate: roiClaimGate);

        string expected = PilotProjectedDollarClaimsSponsorSafeHonestyCopy.NoPlain;

        baselineSb.ToString().Should().Contain("**WARN**");
        baselineSb.ToString().Should().NotContain("**PASS**");

        baselineSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Projected dollar claims sponsor-safe |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Projected dollar claims sponsor-safe |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);
    }

    [Fact]
    public void Roi_baseline_section_when_stale_fallback_copy_uses_roi_claim_gate_narrative_not_proof()
    {
        PilotRoiBaselineInputsStatusResponse inputs = new()
        {
            ProjectedDollarClaimsSponsorSafe = true,
            SponsorSafeFallbackCopy = "Stale pass — safe to quote projected savings.",
            ReviewCycleHoursBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.BuyerProvided,
        };

        var roiClaimGate = new SponsorRoiClaimDispositionResult(
            SponsorRoiClaimDisposition.Hold,
            PilotRoiEvidenceConfidence.Low,
            "review-cycle baseline: No measurement yet",
            false,
            "HOLD — collect baselines.",
            "Live gate narrative — do not quote savings.");

        StringBuilder baselineSb = new();
        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(baselineSb, inputs, roiClaimGate);

        string md = baselineSb.ToString();
        md.Should().Contain("Live gate narrative");
        md.Should().NotContain("Stale pass");
    }
}
