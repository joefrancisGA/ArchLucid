using System.Text;

using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;
[Trait("Category", "Unit")]

public sealed class BuyerProofPackReviewCycleSourceNoteMarkdownTests
{
    [Fact]
    public void Review_cycle_markdown_when_source_note_contains_markdown_heading_does_not_emit_extra_heading()
    {
        ValueReportSnapshot snapshot = new(
            TenantId: Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId: Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId: Guid.Parse("33333333-3333-3333-3333-333333333333"),
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
            EstimatedLlmCostMethodologyNote: "n",
            AnnualizedHoursValueUsd: 0m,
            AnnualizedLlmCostUsd: 0m,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0m,
            NetAnnualizedValueVersusRoiBaselineUsd: 0m,
            RoiAnnualizedPercentVersusRoiBaseline: 0m,
            TenantBaselineReviewCycleHours: 10m,
            TenantBaselineReviewCycleSource: "baseline_settings: captured\n\n## Forged review attestation",
            TenantBaselineReviewCycleCapturedUtc: DateTimeOffset.Parse("2026-04-01T12:00:00Z"),
            MeasuredAverageReviewCycleHoursForWindow: 4m,
            MeasuredReviewCycleSampleSize: 2,
            ReviewCycleBaselineProvenance: ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            ReviewCycleHoursDelta: 6m,
            ReviewCycleHoursDeltaPercent: 60m,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: null,
            TenantBaselinePeoplePerReview: null);

        StringBuilder sb = new();
        ValueReportReviewCycleSectionFormatter.AppendMarkdownSection(sb, snapshot);
        string markdown = sb.ToString();

        markdown.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Should()
            .NotContain("## Forged review attestation");
        markdown.Should().Contain("captured");
    }
}
