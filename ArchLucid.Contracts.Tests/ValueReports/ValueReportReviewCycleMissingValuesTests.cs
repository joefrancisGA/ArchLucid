using System.Text;

using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ValueReports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ValueReportReviewCycleMissingValuesTests
{
    private const string Heading = "Review-cycle delta (before vs measured)";
    private const string Baseline = "Baseline review cycle: 12.5 h (tenant-supplied at trial signup)";
    private const string Measured = "Measured review cycle (this window): 8.25 h across 3 run(s)";
    private const string BaselineUnavailable = "Baseline review cycle: Not available";
    private const string MeasuredUnavailable = "Measured review cycle (this window): Not available";

    [Theory]
    [InlineData(true, false, true, Baseline, MeasuredUnavailable)]
    [InlineData(false, true, false, BaselineUnavailable, Measured)]
    [InlineData(true, true, false, Baseline, Measured)]
    public void Partial_comparison_shows_known_values_without_claiming_savings(
        bool hasBaseline,
        bool hasMeasured,
        bool hasDelta,
        string expectedBaseline,
        string expectedMeasured)
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            baseline: hasBaseline ? 12.5m : null,
            measured: hasMeasured ? 8.25m : null,
            delta: hasDelta ? 4.25m : null,
            deltaPercent: 34m);

        AssertLines(snapshot, [Heading, expectedBaseline, expectedMeasured], [$"## {Heading}", expectedBaseline, expectedMeasured]);
    }

    [Theory]
    [InlineData(false, Measured, "Delta: 4.25 h saved per run (34% improvement)")]
    [InlineData(true, "Measured review cycle (this window): 0 h across 3 run(s)", "Delta: 12.5 h saved per run (100% improvement)")]
    public void Complete_comparison_prints_numeric_measurements_including_zero(
        bool measuredZero,
        string expectedMeasured,
        string expectedDelta)
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            baseline: 12.5m,
            measured: measuredZero ? 0m : 8.25m,
            delta: measuredZero ? 12.5m : 4.25m,
            deltaPercent: measuredZero ? 100m : 34m);

        AssertLines(
            snapshot,
            [Heading, Baseline, expectedMeasured, expectedDelta],
            [$"## {Heading}", Baseline, expectedMeasured, expectedDelta]);
    }

    [Fact]
    public void No_measurement_period_keeps_the_existing_note_without_comparison_lines()
    {
        const string note = "(No committed manifests in this window — measured review cycle is not yet available.)";
        ValueReportSnapshot snapshot = CreateSnapshot(12.5m, null, null, null) with
        {
            RunsCompletedCount = 0,
            ManifestsCommittedCount = 0,
            ReviewCycleBaselineProvenance = ReviewCycleBaselineProvenance.NoMeasurementYet,
        };

        AssertLines(snapshot, [Heading, note], [$"## {Heading}", $"_{note}_"]);
    }

    [Fact]
    public void Known_hours_delta_does_not_require_a_percentage_or_a_separately_stored_baseline()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(null, 8.25m, 4.25m, null) with
        {
            ReviewCycleBaselineProvenance = ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions,
        };
        const string baseline = "Baseline review cycle: 12.5 h (default from PILOT_ROI_MODEL.md (tenant did not provide a baseline at signup))";
        const string delta = "Delta: 4.25 h saved per run";
        IReadOnlyList<ValueReportReviewCycleParagraph> paragraphs =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(snapshot, SponsorRoiClaimDisposition.Pass);
        StringBuilder markdown = new();
        ValueReportReviewCycleSectionFormatter.AppendMarkdownSection(markdown, snapshot, SponsorRoiClaimDisposition.Pass);

        paragraphs.Select(p => p.Text).Should().ContainInOrder(baseline, Measured, delta);
        markdown.ToString().Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Should().ContainInOrder(baseline, Measured, delta);
    }

    private static void AssertLines(ValueReportSnapshot snapshot, string[] expectedParagraphs, string[] expectedMarkdown)
    {
        IReadOnlyList<ValueReportReviewCycleParagraph> paragraphs =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(snapshot, SponsorRoiClaimDisposition.Pass);
        StringBuilder markdown = new();
        ValueReportReviewCycleSectionFormatter.AppendMarkdownSection(markdown, snapshot, SponsorRoiClaimDisposition.Pass);

        paragraphs.Select(p => p.Text).Should().Equal(expectedParagraphs);
        markdown.ToString().Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Should().Equal(expectedMarkdown);
    }

    private static ValueReportSnapshot CreateSnapshot(decimal? baseline, decimal? measured, decimal? delta, decimal? deltaPercent) =>
        new(
            Guid.Empty, Guid.Empty, Guid.Empty, DateTimeOffset.UnixEpoch, DateTimeOffset.UnixEpoch.AddDays(1), [],
            RunsCompletedCount: 3,
            ManifestsCommittedCount: measured is null ? 0 : 3,
            GovernanceEventsHandledCount: 0,
            DriftAlertEventsCaughtCount: 0,
            EstimatedArchitectHoursSavedFromManifests: 0m,
            EstimatedArchitectHoursSavedFromGovernanceEvents: 0m,
            EstimatedArchitectHoursSavedFromDriftEvents: 0m,
            EstimatedTotalArchitectHoursSaved: 0m,
            EstimatedLlmCostForWindowUsd: 0m,
            EstimatedLlmCostMethodologyNote: "test",
            AnnualizedHoursValueUsd: 0m,
            AnnualizedLlmCostUsd: 0m,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0m,
            NetAnnualizedValueVersusRoiBaselineUsd: 0m,
            RoiAnnualizedPercentVersusRoiBaseline: 0m,
            TenantBaselineReviewCycleHours: baseline,
            TenantBaselineReviewCycleSource: null,
            TenantBaselineReviewCycleCapturedUtc: null,
            MeasuredAverageReviewCycleHoursForWindow: measured,
            MeasuredReviewCycleSampleSize: measured is null ? 0 : 3,
            ReviewCycleBaselineProvenance: ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            ReviewCycleHoursDelta: delta,
            ReviewCycleHoursDeltaPercent: deltaPercent,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: null,
            TenantBaselinePeoplePerReview: null);
}
