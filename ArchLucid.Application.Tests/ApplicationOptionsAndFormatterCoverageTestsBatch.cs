using ArchLucid.Application.Analysis;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Summaries;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationOptionsAndFormatterCoverageTestsBatch
{
    [Fact]
    public void ManifestSummaryOptions_default_enables_all_sections()
    {
        ManifestSummaryOptions options = ManifestSummaryOptions.Default;

        options.IncludeRequiredControls.Should().BeTrue();
        options.IncludeComponentControls.Should().BeTrue();
        options.IncludeRelationships.Should().BeTrue();
        options.IncludeComplianceTags.Should().BeTrue();
        options.MaxRelationships.Should().BeNull();
    }

    [Fact]
    public void DefaultConsultingDocxTemplateOptionsProvider_returns_bound_options()
    {
        ConsultingDocxTemplateOptions expected = new() { DocumentTitle = "Custom title" };
        DefaultConsultingDocxTemplateOptionsProvider sut =
            new(Options.Create(expected));

        sut.GetOptions().DocumentTitle.Should().Be("Custom title");
    }

    [Fact]
    public void CommittedEffectiveGovernanceSnapshotCaptureOptions_allows_preloaded_assignments()
    {
        CommittedEffectiveGovernanceSnapshotCaptureOptions options = new()
        {
            PreloadedScopePolicyPackAssignments = [],
        };

        options.PreloadedScopePolicyPackAssignments.Should().NotBeNull();
    }

    [Fact]
    public void ValueReportSnapshotMarkdownFormatter_emits_headline_metrics()
    {
        ExportFormatterService formatter = new();
        ValueReportSnapshotMarkdownFormatter sut = new(formatter);
        DateTimeOffset from = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset to = from.AddDays(30);
        ValueReportSnapshot snapshot = new(
            TenantId: Guid.NewGuid(),
            WorkspaceId: Guid.NewGuid(),
            ProjectId: Guid.NewGuid(),
            PeriodFromUtc: from,
            PeriodToUtc: to,
            RunStatusRows: [],
            RunsCompletedCount: 3,
            ManifestsCommittedCount: 2,
            GovernanceEventsHandledCount: 1,
            DriftAlertEventsCaughtCount: 0,
            EstimatedArchitectHoursSavedFromManifests: 4,
            EstimatedArchitectHoursSavedFromGovernanceEvents: 1,
            EstimatedArchitectHoursSavedFromDriftEvents: 0,
            EstimatedTotalArchitectHoursSaved: 5,
            EstimatedLlmCostForWindowUsd: 12.5m,
            EstimatedLlmCostMethodologyNote: "token estimate",
            AnnualizedHoursValueUsd: 1000,
            AnnualizedLlmCostUsd: 150,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 5000,
            NetAnnualizedValueVersusRoiBaselineUsd: 4850,
            RoiAnnualizedPercentVersusRoiBaseline: 97,
            TenantBaselineReviewCycleHours: null,
            TenantBaselineReviewCycleSource: null,
            TenantBaselineReviewCycleCapturedUtc: null,
            MeasuredAverageReviewCycleHoursForWindow: null,
            MeasuredReviewCycleSampleSize: 0,
            ReviewCycleBaselineProvenance: ReviewCycleBaselineProvenance.NoMeasurementYet,
            ReviewCycleHoursDelta: null,
            ReviewCycleHoursDeltaPercent: null,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: null,
            TenantBaselinePeoplePerReview: null);

        string markdown = sut.Format(snapshot);

        markdown.Should().Contain("Runs completed");
        markdown.Should().Contain("3");
        markdown.Should().Contain("token estimate");
    }
}
