using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorProofReadinessClassifierTests
{
    [Fact]
    public void Classify_demo_tenant_is_demo_only_regardless_of_gate_sendability()
    {
        (_, _, PilotRunDeltas deltas, PilotBuyerSafeEvidenceGateResult gate, _) =
            Fixture(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, isDemoTenant: true);

        SponsorProofReadinessClassifier.Classify(deltas, gate).Should().Be(SponsorProofReadinessClassification.DemoOnly);
    }

    [Fact]
    public void Classify_strong_baseline_non_demo_is_sendable()
    {
        (_, _, PilotRunDeltas deltas, PilotBuyerSafeEvidenceGateResult gate, _) =
            Fixture(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, isDemoTenant: false);

        SponsorProofReadinessClassifier.Classify(deltas, gate).Should().Be(SponsorProofReadinessClassification.Sendable);
    }

    [Fact]
    public void Classify_defaulted_baseline_only_soft_gap_is_needs_baseline()
    {
        (_, _, PilotRunDeltas deltas, PilotBuyerSafeEvidenceGateResult gate, _) =
            Fixture(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions, isDemoTenant: false);

        SponsorProofReadinessClassifier.Classify(deltas, gate).Should().Be(SponsorProofReadinessClassification.NeedsBaseline);
    }

    [Fact]
    public void Classify_llm_unresolved_soft_gap_is_incomplete_not_needs_baseline()
    {
        (ArchitectureRun run, GoldenManifest manifest, PilotRunDeltas deltas, _, ValueReportSnapshot snap) =
            Fixture(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, isDemoTenant: false);
        deltas = deltas with { LlmCallCount = 0, LlmCallCountResolved = false };
        PilotBuyerSafeEvidenceGateResult gate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, snap);

        SponsorProofReadinessClassifier.Classify(deltas, gate).Should().Be(SponsorProofReadinessClassification.Incomplete);
    }

    private static (ArchitectureRun Run, GoldenManifest Manifest, PilotRunDeltas Deltas, PilotBuyerSafeEvidenceGateResult Gate, ValueReportSnapshot Snap)
        Fixture(ReviewCycleBaselineProvenance provenance, bool isDemoTenant)
    {
        ArchitectureRun run = new()
        {
            RunId = "run-classifier",
            RequestId = "req-classifier",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            RealModeFellBackToSimulator = false,
        };

        GoldenManifest manifest = new()
        {
            RunId = "run-classifier",
            SystemName = "Sys",
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc), },
            Governance = new ManifestGovernance(),
        };

        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = run.CreatedUtc,
            ManifestCommittedUtc = manifest.Metadata.CreatedUtc,
            TimeToCommittedManifest = manifest.Metadata.CreatedUtc - run.CreatedUtc,
            FindingsBySeverity = [new KeyValuePair<string, int>("Error", 1)],
            AuditRowCount = 4,
            AuditRowCountTruncated = false,
            LlmCallCount = 2,
            LlmCallCountResolved = true,
            TopFindingId = "f-1",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new(),
            IsDemoTenant = isDemoTenant,
        };

        ValueReportSnapshot snap = SnapshotWith(provenance);
        PilotBuyerSafeEvidenceGateResult gate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, snap);

        return (run, manifest, deltas, gate, snap);
    }

    private static ValueReportSnapshot SnapshotWith(ReviewCycleBaselineProvenance provenance)
    {
        Guid tid = Guid.Parse("11111111-1111-1111-1111-111111111111");

        return new ValueReportSnapshot(
            TenantId: tid,
            WorkspaceId: Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId: Guid.Parse("33333333-3333-3333-3333-333333333333"),
            PeriodFromUtc: DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
            PeriodToUtc: DateTimeOffset.Parse("2026-02-01T00:00:00Z"),
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
            RoiAnnualizedPercentVersusRoiBaseline: 10m,
            TenantBaselineReviewCycleHours: 8m,
            TenantBaselineReviewCycleSource: "signup",
            TenantBaselineReviewCycleCapturedUtc: DateTimeOffset.Parse("2026-04-01T12:00:00Z"),
            MeasuredAverageReviewCycleHoursForWindow: 8m,
            MeasuredReviewCycleSampleSize: 2,
            ReviewCycleBaselineProvenance: provenance,
            ReviewCycleHoursDelta: 2m,
            ReviewCycleHoursDeltaPercent: 10m,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: null,
            TenantBaselinePeoplePerReview: null);
    }
}
