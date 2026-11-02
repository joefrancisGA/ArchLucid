using System.Text.Json;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.User;
using ArchLucid.Contracts.ValueReports;

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
    public void ToResponseWithProofPackage_Maps_execute_posture_fields_for_cli_bundle()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid().ToString("N"),
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoor = WorkingCareerRehearsalDoorValues.Rehearsal,
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

        response.StructuralExecutionMode.Should().Be(StructuralExecutionMode.Simulator);
        response.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
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

    [Fact]
    public void ToResponseWithProofPackage_MapsRoiSourceFreshnessDispositionHoldWhenStaleExtractor()
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
            RunCreatedUtc = DateTime.UtcNow,
            IsDemoTenant = false,
            EstimatedUsdSavings = 100m,
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

        DateTime staleTs = DateTime.UtcNow.AddDays(-45);

        PilotRunDeltasResponse response =
            PilotRunDeltasResponseMapper.ToResponseWithProofPackage(run, manifest, deltas, valueReport, staleTs);

        response.RoiSourceFreshnessDisposition.Should().Be("HOLD");
    }

    [Fact]
    public void ToResponseWithProofPackage_when_llm_traces_unresolved_omits_llm_call_count_from_json()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid().ToString("N"),
            Status = ArchitectureRunStatus.Committed,
        };

        GoldenManifest manifest = new()
        {
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
        };

        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = DateTime.UtcNow,
            ManifestCommittedUtc = DateTime.UtcNow,
            LlmCallCount = 0,
            LlmCallCountResolved = false,
        };

        ValueReportSnapshot valueReport = MinimalValueReportSnapshot();

        PilotRunDeltasResponse response =
            PilotRunDeltasResponseMapper.ToResponseWithProofPackage(run, manifest, deltas, valueReport);

        response.LlmCallCountResolved.Should().BeFalse();
        response.LlmCallCount.Should().BeNull();

        string json = JsonSerializer.Serialize(response, ContractJson.Default);
        json.Should().NotContain("\"llmCallCount\":0");
        json.Should().NotContain("\"llmCallCount\": 0");
    }

    [Fact]
    public void ToResponseWithProofPackage_when_audit_count_unresolved_maps_resolved_false()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid().ToString("N"),
            Status = ArchitectureRunStatus.Committed,
        };

        GoldenManifest manifest = new()
        {
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
        };

        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = DateTime.UtcNow,
            ManifestCommittedUtc = DateTime.UtcNow,
            AuditRowCount = 0,
            AuditRowCountResolved = false,
        };

        ValueReportSnapshot valueReport = MinimalValueReportSnapshot();

        PilotRunDeltasResponse response =
            PilotRunDeltasResponseMapper.ToResponseWithProofPackage(run, manifest, deltas, valueReport);

        response.AuditRowCountResolved.Should().BeFalse();
        response.ProofPackageCompleteness!.AuditRowCountResolved.Should().BeFalse();
    }

    private static ValueReportSnapshot MinimalValueReportSnapshot() =>
        new(
            TenantId: Guid.NewGuid(),
            WorkspaceId: Guid.NewGuid(),
            ProjectId: Guid.NewGuid(),
            PeriodFromUtc: DateTimeOffset.UtcNow,
            PeriodToUtc: DateTimeOffset.UtcNow,
            RunStatusRows: [],
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
            TenantBaselinePeoplePerReview: null);
}
