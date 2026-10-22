using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Persistence.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PilotRoiBaselineInputsStatusResolverTests
{
    [Fact]
    public void Resolve_BuyerProvidedInputs_AllowsProjectedDollarClaims()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.TenantSuppliedViaSettings, manualPrepHours: 6m);
        PilotBaselineRecord scorecard = new()
        {
            TenantId = snapshot.TenantId,
            BaselineHoursPerReview = 8m,
            BaselineReviewsPerQuarter = 4,
            BaselineArchitectHourlyCost = 175m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };
        PilotRunDeltas deltas = NonDemoDeltas();

        PilotRoiBaselineInputsStatusResponse status =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, deltas, scorecard);

        status.ReviewCycleHoursBasis.Should().Be(PilotRoiBaselineInputBasis.BuyerProvided);
        status.ArchitectPrepHoursPerReviewBasis.Should().Be(PilotRoiBaselineInputBasis.BuyerProvided);
        status.EvidenceAssemblyEffortBasis.Should().Be(PilotRoiBaselineInputBasis.BuyerProvided);
        status.ArchitectHourlyCostBasis.Should().Be(PilotRoiBaselineInputBasis.BuyerProvided);
        status.ProjectedDollarClaimsSponsorSafe.Should().BeTrue();
    }

    [Fact]
    public void Resolve_MissingScorecardInputs_BlocksProjectedDollarClaims()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, manualPrepHours: null);
        PilotRunDeltas deltas = NonDemoDeltas();

        PilotRoiBaselineInputsStatusResponse status =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, deltas, scorecardBaselines: null);

        status.ReviewCycleHoursBasis.Should().Be(PilotRoiBaselineInputBasis.BuyerProvided);
        status.ArchitectPrepHoursPerReviewBasis.Should().Be(PilotRoiBaselineInputBasis.NotCollected);
        status.EvidenceAssemblyEffortBasis.Should().Be(PilotRoiBaselineInputBasis.NotCollected);
        status.ArchitectHourlyCostBasis.Should().Be(PilotRoiBaselineInputBasis.NotCollected);
        status.ProjectedDollarClaimsSponsorSafe.Should().BeFalse();
        status.SponsorSafeFallbackCopy.Should().Contain("Do not lead sponsor readouts with projected dollar savings");
    }

    [Fact]
    public void Resolve_DemoTenant_MarksAllInputsDemoDerived()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, manualPrepHours: 6m);
        PilotRunDeltas deltas = NonDemoDeltas() with { IsDemoTenant = true };

        PilotRoiBaselineInputsStatusResponse status =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, deltas, scorecardBaselines: null);

        status.ReviewCycleHoursBasis.Should().Be(PilotRoiBaselineInputBasis.DemoDerived);
        status.ArchitectPrepHoursPerReviewBasis.Should().Be(PilotRoiBaselineInputBasis.DemoDerived);
        status.EvidenceAssemblyEffortBasis.Should().Be(PilotRoiBaselineInputBasis.DemoDerived);
        status.ArchitectHourlyCostBasis.Should().Be(PilotRoiBaselineInputBasis.DemoDerived);
        status.ProjectedDollarClaimsSponsorSafe.Should().BeFalse();
    }

    [Fact]
    public void Resolve_DefaultedReviewCycle_MarksReviewCycleAsDefaulted()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions, manualPrepHours: 5m);
        PilotBaselineRecord scorecard = new()
        {
            TenantId = snapshot.TenantId,
            BaselineReviewsPerQuarter = 6,
            BaselineArchitectHourlyCost = 150m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        PilotRoiBaselineInputsStatusResponse status =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, NonDemoDeltas(), scorecard);

        status.ReviewCycleHoursBasis.Should().Be(PilotRoiBaselineInputBasis.Defaulted);
        status.ProjectedDollarClaimsSponsorSafe.Should().BeFalse();
    }

    private static PilotRunDeltas NonDemoDeltas() =>
        new() { RunCreatedUtc = DateTime.UtcNow, IsDemoTenant = false };

    private static ValueReportSnapshot Snapshot(ReviewCycleBaselineProvenance provenance, decimal? manualPrepHours)
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        return new ValueReportSnapshot(
            TenantId: tenantId,
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
            RoiAnnualizedPercentVersusRoiBaseline: 0m,
            TenantBaselineReviewCycleHours: 8m,
            TenantBaselineReviewCycleSource: "signup",
            TenantBaselineReviewCycleCapturedUtc: DateTimeOffset.Parse("2026-04-01T12:00:00Z"),
            MeasuredAverageReviewCycleHoursForWindow: 6m,
            MeasuredReviewCycleSampleSize: 2,
            ReviewCycleBaselineProvenance: provenance,
            ReviewCycleHoursDelta: 2m,
            ReviewCycleHoursDeltaPercent: 10m,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: manualPrepHours,
            TenantBaselinePeoplePerReview: null);
    }
}
