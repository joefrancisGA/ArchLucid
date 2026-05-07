using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PilotProofPackageCompletenessMapperTests
{
    [Fact]
    public void Build_StrongRoi_CommittedNonDemo_HasStrongTierAndPassFlags()
    {
        (ArchitectureRun run, GoldenManifest manifest, PilotRunDeltas deltas, PilotBuyerSafeEvidenceGateResult gate, ValueReportSnapshot snap) =
            StrongBaselineFixture();

        ProofPackageCompletenessResponse c = PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, gate, snap);

        c.RoiEvidenceConfidence.Should().Be(PilotRoiEvidenceConfidence.Strong);
        c.SupportRunIdPresent.Should().BeTrue();
        c.DemoTenantWarningRequired.Should().BeFalse();
        c.CommittedManifestPresent.Should().BeTrue();
        c.TimeToCommittedManifestResolved.Should().BeTrue();
        c.FindingsBySeverityPresent.Should().BeTrue();
        c.TopFindingEvidenceChainPresentOrNotApplicable.Should().BeTrue();
        c.AuditRowsPresentOrLowerBound.Should().BeTrue();
        c.LlmCallCountResolved.Should().BeTrue();
        c.LlmCallCount.Should().Be(2);
        c.ProofSendability.Should().Be(nameof(ProofPackageSendability.Sendable));
        c.AgentOutputPilotStrictEvidenceSatisfied.Should().BeTrue();
    }

    [Fact]
    public void Build_PartialRoi_DefaultedBaseline_EmitsPartialTier()
    {
        (ArchitectureRun run, GoldenManifest manifest, PilotRunDeltas deltas, _, _) = StrongBaselineFixture();
        ValueReportSnapshot snap = SnapshotWith(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions);
        PilotBuyerSafeEvidenceGateResult gate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, snap);

        ProofPackageCompletenessResponse c = PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, gate, snap);

        c.RoiEvidenceConfidence.Should().Be(PilotRoiEvidenceConfidence.Partial);
    }

    [Fact]
    public void Build_LowRoi_NoMeasurement_EmitsLowTier()
    {
        (ArchitectureRun run, GoldenManifest manifest, PilotRunDeltas deltas, _, _) = StrongBaselineFixture();
        ValueReportSnapshot snap = SnapshotWith(ReviewCycleBaselineProvenance.NoMeasurementYet);
        PilotBuyerSafeEvidenceGateResult gate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, snap);

        ProofPackageCompletenessResponse c = PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, gate, snap);

        c.RoiEvidenceConfidence.Should().Be(PilotRoiEvidenceConfidence.Low);
    }

    [Fact]
    public void Build_DemoTenant_SetsDemoWarningAndMatchesGateSendability()
    {
        (ArchitectureRun run, GoldenManifest manifest, PilotRunDeltas deltas, _, _) = StrongBaselineFixture();
        deltas = deltas with { IsDemoTenant = true };
        ValueReportSnapshot snap = SnapshotWith(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup);
        PilotBuyerSafeEvidenceGateResult gate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, snap);

        ProofPackageCompletenessResponse c = PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, gate, snap);

        c.DemoTenantWarningRequired.Should().BeTrue();
        c.ProofSendability.Should().Be(nameof(ProofPackageSendability.NotSendable));
        c.PublishingTier.Should().Be(nameof(PilotBuyerSafeEvidencePublishingTier.DemoOnly));
    }

    [Fact]
    public void Build_PilotStrictViolates_FlagsEvidenceUnsatisfied()
    {
        (ArchitectureRun run, GoldenManifest manifest, PilotRunDeltas deltas, _, ValueReportSnapshot snap) =
            StrongBaselineFixture();
        deltas = deltas with
        {
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = true,
        };
        PilotBuyerSafeEvidenceGateResult gate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, snap);

        ProofPackageCompletenessResponse c = PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, gate, snap);

        c.AgentOutputPilotStrictEvidenceSatisfied.Should().BeFalse();
    }

    [Fact]
    public void Build_UnresolvedLlmTraces_FlagsLlmCallCountUnresolved()
    {
        (ArchitectureRun run, GoldenManifest manifest, PilotRunDeltas deltas, _, ValueReportSnapshot snap) =
            StrongBaselineFixture();
        deltas = deltas with { LlmCallCount = 0, LlmCallCountResolved = false };
        PilotBuyerSafeEvidenceGateResult gate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, snap);

        ProofPackageCompletenessResponse c = PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, gate, snap);

        c.LlmCallCountResolved.Should().BeFalse();
    }

    private static (ArchitectureRun Run, GoldenManifest Manifest, PilotRunDeltas Deltas, PilotBuyerSafeEvidenceGateResult Gate, ValueReportSnapshot Snap) StrongBaselineFixture()
    {
        ArchitectureRun run = new()
        {
            RunId = "run-proof",
            RequestId = "req-proof",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            RealModeFellBackToSimulator = false,
        };

        GoldenManifest manifest = new()
        {
            RunId = "run-proof",
            SystemName = "Sys",
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v1",
                CreatedUtc = new DateTime(2026, 4, 1, 13, 0, 0, DateTimeKind.Utc),
            },
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
            IsDemoTenant = false,
        };

        ValueReportSnapshot snap = SnapshotWith(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup);
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
