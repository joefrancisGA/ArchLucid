using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

public sealed class RoiEvidenceCompletenessMarkdownFormatterTests
{
    [Fact]
    public void Describe_DefaultModelBaseline_is_partial_confidence_and_names_repo_source()
    {
        ValueReportSnapshot snap = CreateMinimalSnapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions);

        (string headline, string body) = RoiEvidenceCompletenessMarkdownFormatter.Describe(snap);

        headline.Should().Be("Partial");
        body.Should().Contain("docs/library/PILOT_ROI_MODEL.md");
    }

    [Fact]
    public void Describe_no_measurement_carries_low_confidence_headline()
    {
        ValueReportSnapshot snap = CreateMinimalSnapshot(ReviewCycleBaselineProvenance.NoMeasurementYet);

        (string headline, _) = RoiEvidenceCompletenessMarkdownFormatter.Describe(snap);

        headline.Should().Be("Low confidence");
    }

    [Fact]
    public void Describe_tenant_captured_baselines_carry_strong_confidence_and_metadata()
    {
        DateTimeOffset captured = DateTimeOffset.Parse("2026-04-01T12:00:00Z");
        ValueReportSnapshot snap = CreateMinimalSnapshot(
            ReviewCycleBaselineProvenance.TenantSuppliedViaSettings,
            manualPrep: 5.25m,
            capturedUtc: captured,
            tenantSourceNote: "  Baseline questionnaire  ");

        (string headline, string body) = RoiEvidenceCompletenessMarkdownFormatter.Describe(snap);

        headline.Should().Be("Strong");
        body.Should().Contain("Baseline questionnaire");
        body.Should().Contain("5.25");
        body.Should().Contain(captured.ToString("O"));
    }

    [Fact]
    public void AppendMarkdownSection_includes_section_heading()
    {
        ValueReportSnapshot snap = CreateMinimalSnapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions);
        StringBuilder sb = new();

        RoiEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(sb, snap);

        sb.ToString().Should().Contain("## ROI evidence completeness");
    }

    private static ValueReportSnapshot CreateMinimalSnapshot(
        ReviewCycleBaselineProvenance provenance,
        decimal? manualPrep = null,
        DateTimeOffset? capturedUtc = null,
        string? tenantSourceNote = null)
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
            TenantBaselineReviewCycleSource: tenantSourceNote,
            TenantBaselineReviewCycleCapturedUtc: capturedUtc,
            MeasuredAverageReviewCycleHoursForWindow: null,
            MeasuredReviewCycleSampleSize: 0,
            ReviewCycleBaselineProvenance: provenance,
            ReviewCycleHoursDelta: null,
            ReviewCycleHoursDeltaPercent: null,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: manualPrep,
            TenantBaselinePeoplePerReview: null);
    }
}
