using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public class PilotRunDeltasResponseMapperTests
{
    [Fact]
    public void ToResponseWithProofPackage_MapsExtractorCollectionTimestampUtc()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid().ToString("N")
        };

        DateTime ts = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);
        GoldenManifest manifest = new()
        {
            Metadata = new ManifestMetadata()
        };

        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = DateTime.UtcNow
        };

        ValueReportSnapshot valueReport = new(
            TenantId: Guid.NewGuid(),
            WorkspaceId: Guid.NewGuid(),
            ProjectId: Guid.NewGuid(),
            PeriodFromUtc: DateTimeOffset.UtcNow,
            PeriodToUtc: DateTimeOffset.UtcNow,
            RunStatusRows: new List<ValueReportRunStatusRow>(),
            RunsCompletedCount: 1,
            ManifestsCommittedCount: 0,
            GovernanceEventsHandledCount: 0,
            DriftAlertEventsCaughtCount: 0,
            EstimatedArchitectHoursSavedFromManifests: 0,
            EstimatedArchitectHoursSavedFromGovernanceEvents: 0,
            EstimatedArchitectHoursSavedFromDriftEvents: 0,
            EstimatedTotalArchitectHoursSaved: 0,
            EstimatedLlmCostForWindowUsd: 0,
            EstimatedLlmCostMethodologyNote: "",
            AnnualizedHoursValueUsd: 0,
            AnnualizedLlmCostUsd: 0,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0,
            NetAnnualizedValueVersusRoiBaselineUsd: 0,
            RoiAnnualizedPercentVersusRoiBaseline: 0,
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
            TenantBaselinePeoplePerReview: null
        );

        PilotRunDeltasResponse response =
            PilotRunDeltasResponseMapper.ToResponseWithProofPackage(run, manifest, deltas, valueReport, ts);

        response.ExtractorCollectionTimestampUtc.Should().Be(ts);
    }

    [Fact]
    public void ToResponseWithProofPackage_WhenTimestampOmitted_LeavesNull()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid().ToString("N")
        };

        GoldenManifest manifest = new()
        {
            Metadata = new ManifestMetadata()
        };

        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = DateTime.UtcNow
        };

        ValueReportSnapshot valueReport = new(
            TenantId: Guid.NewGuid(),
            WorkspaceId: Guid.NewGuid(),
            ProjectId: Guid.NewGuid(),
            PeriodFromUtc: DateTimeOffset.UtcNow,
            PeriodToUtc: DateTimeOffset.UtcNow,
            RunStatusRows: new List<ValueReportRunStatusRow>(),
            RunsCompletedCount: 1,
            ManifestsCommittedCount: 0,
            GovernanceEventsHandledCount: 0,
            DriftAlertEventsCaughtCount: 0,
            EstimatedArchitectHoursSavedFromManifests: 0,
            EstimatedArchitectHoursSavedFromGovernanceEvents: 0,
            EstimatedArchitectHoursSavedFromDriftEvents: 0,
            EstimatedTotalArchitectHoursSaved: 0,
            EstimatedLlmCostForWindowUsd: 0,
            EstimatedLlmCostMethodologyNote: "",
            AnnualizedHoursValueUsd: 0,
            AnnualizedLlmCostUsd: 0,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0,
            NetAnnualizedValueVersusRoiBaselineUsd: 0,
            RoiAnnualizedPercentVersusRoiBaseline: 0,
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
            TenantBaselinePeoplePerReview: null
        );

        PilotRunDeltasResponse response =
            PilotRunDeltasResponseMapper.ToResponseWithProofPackage(run, manifest, deltas, valueReport);

        response.ExtractorCollectionTimestampUtc.Should().BeNull();
    }
}
