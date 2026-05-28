using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class SponsorArtifactEvidenceBadgeMarkdownFormatterTests
{
    [Fact]
    public void Resolve_demo_tenant_marks_demo_derived_and_warns()
    {
        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            new PilotRunDeltas { IsDemoTenant = true },
            new ProofPackageCompletenessResponse { DemoTenantWarningRequired = true },
            CreateSnapshot(ReviewCycleBaselineProvenance.NoMeasurementYet),
            ExecutiveRoiSavingsPricingBasis.Retail,
            RoiCostEvidenceFreshness.Fresh);

        badges.SourceToken.Should().Be("demo-derived");
        badges.WarnBeforeSponsorSend.Should().BeTrue();
    }

    [Fact]
    public void Resolve_uploaded_actual_with_fresh_evidence_is_sendable()
    {
        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse(),
            CreateSnapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions),
            ExecutiveRoiSavingsPricingBasis.UploadedActualAmortized,
            RoiCostEvidenceFreshness.Fresh);

        badges.SourceToken.Should().Be("uploaded-actual-amortized");
        badges.FreshnessToken.Should().Be("fresh");
        badges.WarnBeforeSponsorSend.Should().BeFalse();
    }

    [Fact]
    public void Resolve_stale_retail_catalog_still_warns_before_sponsor_send()
    {
        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse(),
            CreateSnapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions),
            ExecutiveRoiSavingsPricingBasis.Retail,
            RoiCostEvidenceFreshness.Stale);

        badges.FreshnessToken.Should().Be("stale");
        badges.WarnBeforeSponsorSend.Should().BeTrue();
    }

    [Fact]
    public void Resolve_heuristic_fallback_warns_before_sponsor_send()
    {
        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse(),
            CreateSnapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions),
            ExecutiveRoiSavingsPricingBasis.HeuristicFallback,
            RoiCostEvidenceFreshness.Fresh);

        badges.SourceToken.Should().Be("heuristic-fallback");
        badges.WarnBeforeSponsorSend.Should().BeTrue();
    }

    [Fact]
    public void Resolve_not_collected_freshness_warns_before_sponsor_send()
    {
        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse(),
            CreateSnapshot(ReviewCycleBaselineProvenance.NoMeasurementYet),
            ExecutiveRoiSavingsPricingBasis.Retail,
            "Unknown");

        badges.FreshnessToken.Should().Be("not-collected");
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
