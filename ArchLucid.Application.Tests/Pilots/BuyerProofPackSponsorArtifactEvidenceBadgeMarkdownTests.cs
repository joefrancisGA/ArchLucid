using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorArtifactEvidenceBadgeMarkdownTests
{
    [Fact]
    public void BuyerProofPack_badge_freshness_when_status_has_surrounding_whitespace_maps_to_fresh_token()
    {
        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse(),
            CreateSnapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions),
            SponsorRoiSavingsPricingBasis.Retail,
            $"  {RoiCostEvidenceFreshness.Fresh}  ");

        badges.FreshnessToken.Should().Be("fresh");
        badges.WarnBeforeSponsorSend.Should().BeFalse();
    }

    [Fact]
    public void BuyerProofPack_badge_pricing_basis_when_stale_proof_strong_but_roi_claim_gate_low_uses_heuristic_fallback()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        var roiClaimGate = new SponsorRoiClaimDispositionResult(
            SponsorRoiClaimDisposition.Hold,
            PilotRoiEvidenceConfidence.Low,
            "review-cycle baseline: No measurement yet",
            false,
            "Hold",
            "Hold narrative");

        string savingsBasis = FirstValueReportBuilder.ResolveSavingsPricingBasisForBadges(
            proof,
            new PilotRunDeltas(),
            hasUploadedCostEvidence: false,
            roiClaimGate);

        savingsBasis.Should().Be(SponsorRoiSavingsPricingBasis.HeuristicFallback);

        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            new PilotRunDeltas(),
            proof,
            CreateSnapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions),
            savingsBasis,
            RoiCostEvidenceFreshness.Fresh);

        badges.SourceToken.Should().Be("heuristic-fallback");
        badges.WarnBeforeSponsorSend.Should().BeTrue();
    }

    private static ValueReportSnapshot CreateSnapshot(ReviewCycleBaselineProvenance provenance)
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        return new ValueReportSnapshot(
            TenantId: tenantId,
            WorkspaceId: workspaceId,
            ProjectId: projectId,
            PeriodFromUtc: DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
            PeriodToUtc: DateTimeOffset.Parse("2026-01-08T00:00:00Z"),
            RunStatusRows: [],
            RunsCompletedCount: 0,
            ManifestsCommittedCount: 0,
            GovernanceEventsHandledCount: 0,
            DriftAlertEventsCaughtCount: 0,
            EstimatedArchitectHoursSavedFromManifests: 0m,
            EstimatedArchitectHoursSavedFromGovernanceEvents: 0m,
            EstimatedArchitectHoursSavedFromDriftEvents: 0m,
            EstimatedTotalArchitectHoursSaved: 0m,
            EstimatedLlmCostForWindowUsd: 0m,
            EstimatedLlmCostMethodologyNote: "",
            AnnualizedHoursValueUsd: 0m,
            AnnualizedLlmCostUsd: 0m,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0m,
            NetAnnualizedValueVersusRoiBaselineUsd: 0m,
            RoiAnnualizedPercentVersusRoiBaseline: 0m,
            TenantBaselineReviewCycleHours: 12m,
            TenantBaselineReviewCycleSource: null,
            TenantBaselineReviewCycleCapturedUtc: null,
            MeasuredAverageReviewCycleHoursForWindow: null,
            MeasuredReviewCycleSampleSize: 0,
            ReviewCycleBaselineProvenance: provenance,
            ReviewCycleHoursDelta: null,
            ReviewCycleHoursDeltaPercent: null,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: null,
            TenantBaselinePeoplePerReview: null);
    }
}
