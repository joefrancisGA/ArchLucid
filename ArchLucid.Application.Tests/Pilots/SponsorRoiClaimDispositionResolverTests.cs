using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Persistence.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorRoiClaimDispositionResolverTests
{
    [Fact]
    public void Resolve_BuyerProvidedInputs_ReturnsPass()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.TenantSuppliedViaSettings, manualPrep: 6m);
        PilotBaselineRecord scorecard = new()
        {
            TenantId = snapshot.TenantId,
            BaselineReviewsPerQuarter = 4,
            BaselineArchitectHourlyCost = 175m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        PilotRoiBaselineInputsStatusResponse inputs =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, NonDemoDeltas(), scorecard);

        SponsorRoiClaimDispositionResult result =
            SponsorRoiClaimDispositionResolver.Resolve(snapshot, inputs, isDemoTenant: false);

        result.Disposition.Should().Be(SponsorRoiClaimDisposition.Pass);
        result.EvidenceConfidence.Should().Be(PilotRoiEvidenceConfidence.Strong);
        result.ProjectedDollarClaimsSponsorSafe.Should().BeTrue();
        result.DispositionLeadLine.Should().Contain("PASS");
    }

    [Fact]
    public void Resolve_DefaultedReviewCycle_ReturnsWarn()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions, manualPrep: 5m);
        PilotBaselineRecord scorecard = new()
        {
            TenantId = snapshot.TenantId,
            BaselineReviewsPerQuarter = 6,
            BaselineArchitectHourlyCost = 150m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        PilotRoiBaselineInputsStatusResponse inputs =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, NonDemoDeltas(), scorecard);

        SponsorRoiClaimDispositionResult result =
            SponsorRoiClaimDispositionResolver.Resolve(snapshot, inputs, isDemoTenant: false);

        result.Disposition.Should().Be(SponsorRoiClaimDisposition.Warn);
        result.EvidenceConfidence.Should().Be(PilotRoiEvidenceConfidence.Partial);
        result.ProjectedDollarClaimsSponsorSafe.Should().BeFalse();
        result.DispositionLeadLine.Should().Contain("WARN");
    }

    [Fact]
    public void Resolve_NotCollectedInputs_ReturnsHold()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.NoMeasurementYet, manualPrep: null);
        PilotRoiBaselineInputsStatusResponse inputs =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, NonDemoDeltas(), scorecardBaselines: null);

        SponsorRoiClaimDispositionResult result =
            SponsorRoiClaimDispositionResolver.Resolve(snapshot, inputs, isDemoTenant: false);

        result.Disposition.Should().Be(SponsorRoiClaimDisposition.Hold);
        result.EvidenceConfidence.Should().Be(PilotRoiEvidenceConfidence.Low);
        result.DispositionLeadLine.Should().Contain("HOLD");
        result.NarrativeBlock.Should().Contain("Do not quote");
    }

    [Fact]
    public void Resolve_DemoTenant_ReturnsHold()
    {
        ValueReportSnapshot snapshot = Snapshot(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, manualPrep: 6m);
        PilotRoiBaselineInputsStatusResponse inputs =
            PilotRoiBaselineInputsStatusResolver.Resolve(snapshot, NonDemoDeltas() with { IsDemoTenant = true }, null);

        SponsorRoiClaimDispositionResult result =
            SponsorRoiClaimDispositionResolver.Resolve(snapshot, inputs, isDemoTenant: true);

        result.Disposition.Should().Be(SponsorRoiClaimDisposition.Hold);
        result.BasisClassSummary.Should().Contain("demo-derived");
    }

    private static PilotRunDeltas NonDemoDeltas() =>
        new() { RunCreatedUtc = DateTime.UtcNow, IsDemoTenant = false };

    private static ValueReportSnapshot Snapshot(ReviewCycleBaselineProvenance provenance, decimal? manualPrep)
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
            TenantBaselineManualPrepHoursPerReview: manualPrep,
            TenantBaselinePeoplePerReview: null);
    }
}
