using ArchLucid.Application.Architecture;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch12Tests
{
    private static readonly TrialLifecycleSchedulerOptions DefaultLifecycleOptions = new()
    {
        ReadOnlyAfterExpireDays = 7,
        ExportOnlyAfterReadOnlyDays = 7,
        PurgeAfterExportOnlyDays = 30,
    };

    [Theory]
    [InlineData(QuickScanGuardRejectionReason.SignInRequired, QuickScanPublicCapacityState.VerificationRequired)]
    [InlineData(QuickScanGuardRejectionReason.GlobalHourlySpendCeiling, QuickScanPublicCapacityState.DemonstrationCapacity)]
    [InlineData(QuickScanGuardRejectionReason.GlobalDailyRequestLimit, QuickScanPublicCapacityState.DemonstrationCapacity)]
    [InlineData(QuickScanGuardRejectionReason.ConcurrentScanLimit, QuickScanPublicCapacityState.Busy)]
    [InlineData(QuickScanGuardRejectionReason.Disabled, QuickScanPublicCapacityState.TemporarilyUnavailable)]
    [InlineData(QuickScanGuardRejectionReason.PerSessionDailyLimit, QuickScanPublicCapacityState.AnonymousLimit)]
    public void QuickScanPublicCapacityStateResolver_maps_guard_rejections(
        QuickScanGuardRejectionReason reason,
        QuickScanPublicCapacityState expectedState)
    {
        QuickScanSafetyOptions options = EnabledSafetyOptions();
        QuickScanPublicCapacityStateResolver.Resolution resolution =
            QuickScanPublicCapacityStateResolver.Resolve(
                QuickScanSafetyOperationalSnapshot.NormalExecution(options),
                QuickScanGuardDecision.Reject(reason),
                options);

        resolution.State.Should().Be(expectedState);
        resolution.AiExecutionAllowed.Should().BeFalse();
    }

    [Fact]
    public void QuickScanPublicCapacityStateResolver_uses_operational_public_message_when_store_unhealthy()
    {
        QuickScanSafetyOptions options = EnabledSafetyOptions();
        QuickScanSafetyOperationalSnapshot operational = new()
        {
            Mode = QuickScanSafetyOperationalMode.Normal,
            AnonymousExecutionAllowed = false,
            SampleResultAvailable = true,
            PublicMessage = "Store degraded.",
            StoreHealthy = false,
        };

        QuickScanPublicCapacityStateResolver.Resolution resolution =
            QuickScanPublicCapacityStateResolver.Resolve(
                operational,
                QuickScanGuardDecision.Permit(),
                options);

        resolution.State.Should().Be(QuickScanPublicCapacityState.TemporarilyUnavailable);
        resolution.Message.Should().Be("Store degraded.");
        resolution.SampleResultAvailable.Should().BeTrue();
    }

    [Fact]
    public void QuickScanPublicCapacityStateResolver_blocks_when_anonymous_execution_disabled()
    {
        QuickScanSafetyOptions options = EnabledSafetyOptions();
        QuickScanSafetyOperationalSnapshot operational = new()
        {
            Mode = QuickScanSafetyOperationalMode.Normal,
            AnonymousExecutionAllowed = false,
            SampleResultAvailable = false,
            PublicMessage = string.Empty,
            StoreHealthy = true,
        };

        QuickScanPublicCapacityStateResolver.Resolution resolution =
            QuickScanPublicCapacityStateResolver.Resolve(
                operational,
                QuickScanGuardDecision.Permit(),
                options);

        resolution.AiExecutionAllowed.Should().BeFalse();
        resolution.State.Should().Be(QuickScanPublicCapacityState.TemporarilyUnavailable);
    }

    [Fact]
    public void QuickScanGuardContextFactory_sets_distributed_concurrency_flag()
    {
        QuickScanGuardContext context = QuickScanGuardContextFactory.Create(
            "203.0.113.10",
            "session-2",
            "Design resilient payments API",
            useDistributedConcurrencyLimit: true);

        context.UseDistributedConcurrencyLimit.Should().BeTrue();
        context.PayloadFingerprint.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TrialLifecyclePolicy_advances_through_expired_read_only_and_export_only_phases()
    {
        DateTimeOffset expires = new(2026, 7, 1, 0, 0, 0, TimeSpan.Zero);

        TrialLifecycleAdvancement? expired = TrialLifecyclePolicy.TryGetNextAdvancement(
            CreateTrialTenant(TrialLifecycleStatus.Active, expires),
            expires.AddMinutes(1),
            DefaultLifecycleOptions);

        expired.Should().NotBeNull();
        expired!.ToStatus.Should().Be(TrialLifecycleStatus.Expired);

        DateTimeOffset readOnlyNotBefore = expires.AddDays(DefaultLifecycleOptions.ReadOnlyAfterExpireDays);

        TrialLifecycleAdvancement? readOnly = TrialLifecyclePolicy.TryGetNextAdvancement(
            CreateTrialTenant(TrialLifecycleStatus.Expired, expires),
            readOnlyNotBefore.AddMinutes(1),
            DefaultLifecycleOptions);

        readOnly.Should().NotBeNull();
        readOnly!.ToStatus.Should().Be(TrialLifecycleStatus.ReadOnly);

        DateTimeOffset exportOnlyNotBefore = readOnlyNotBefore.AddDays(DefaultLifecycleOptions.ExportOnlyAfterReadOnlyDays);

        TrialLifecycleAdvancement? exportOnly = TrialLifecyclePolicy.TryGetNextAdvancement(
            CreateTrialTenant(TrialLifecycleStatus.ReadOnly, expires),
            exportOnlyNotBefore.AddMinutes(1),
            DefaultLifecycleOptions);

        exportOnly.Should().NotBeNull();
        exportOnly!.ToStatus.Should().Be(TrialLifecycleStatus.ExportOnly);

        DateTimeOffset purgeNotBefore = exportOnlyNotBefore.AddDays(DefaultLifecycleOptions.PurgeAfterExportOnlyDays);

        TrialLifecycleAdvancement? deleted = TrialLifecyclePolicy.TryGetNextAdvancement(
            CreateTrialTenant(TrialLifecycleStatus.ExportOnly, expires),
            purgeNotBefore.AddMinutes(1),
            DefaultLifecycleOptions);

        deleted.Should().NotBeNull();
        deleted!.ToStatus.Should().Be(TrialLifecycleStatus.Deleted);
    }

    [Fact]
    public void TrialLifecyclePolicy_compute_days_remaining_clamps_at_zero()
    {
        DateTimeOffset expires = new(2026, 7, 10, 0, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = CreateTrialTenant(TrialLifecycleStatus.Active, expires);

        int? days = TrialLifecyclePolicy.ComputeDaysRemainingForStatusDisplay(
            tenant,
            expires.AddDays(1),
            DefaultLifecycleOptions);

        days.Should().Be(0);
    }

    [Fact]
    public void RoiMetricSourceCatalogBuilder_marks_customer_provided_hours_when_baseline_captured()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            tenantBaselineManualPrepHoursPerReview: 4m,
            reviewCycleBaselineProvenance: ReviewCycleBaselineProvenance.TenantSuppliedViaSettings,
            tenantBaselineReviewCycleHours: 12m,
            tenantBaselineReviewCycleSource: "signup-form");

        IReadOnlyList<RoiMetricSourceRow> rows = RoiMetricSourceCatalogBuilder.Build(snapshot);

        rows.Should().Contain(row =>
            row.MetricKey == "estimated-architect-hours-saved-total"
            && row.SourceKind == RoiMetricSourceKind.CustomerProvided);
        rows.Should().Contain(row =>
            row.MetricKey == "tenant-baseline-review-cycle-hours"
            && row.CitationDetail.Contains("signup-form"));
    }

    [Fact]
    public void RoiMetricSourceCatalogBuilder_marks_not_estimated_when_no_measurement()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            reviewCycleBaselineProvenance: ReviewCycleBaselineProvenance.NoMeasurementYet,
            measuredAverageReviewCycleHoursForWindow: null,
            measuredReviewCycleSampleSize: 0);

        IReadOnlyList<RoiMetricSourceRow> rows = RoiMetricSourceCatalogBuilder.Build(snapshot);

        rows.Should().Contain(row =>
            row.MetricKey == "measured-average-review-cycle-hours"
            && row.SourceKind == RoiMetricSourceKind.NotEstimated
            && row.ValueSummary == "(not estimated)");
    }

    private static QuickScanSafetyOptions EnabledSafetyOptions() => new()
    {
        Enabled = true,
        AnonymousExecutionEnabled = true,
        SampleFallbackEnabled = true,
        EmergencyDisabledMessage = "Quick Scan is temporarily unavailable.",
    };

    private static TenantRecord CreateTrialTenant(string status, DateTimeOffset expiresUtc) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Trial Org",
        Slug = "trial-org",
        Tier = TenantTier.Standard,
        CreatedUtc = expiresUtc.AddDays(-14),
        TrialStatus = status,
        TrialExpiresUtc = expiresUtc,
    };

    private static ValueReportSnapshot CreateSnapshot(
        decimal? tenantBaselineManualPrepHoursPerReview = null,
        ReviewCycleBaselineProvenance reviewCycleBaselineProvenance = ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions,
        decimal? tenantBaselineReviewCycleHours = null,
        string? tenantBaselineReviewCycleSource = null,
        decimal? measuredAverageReviewCycleHoursForWindow = 8m,
        int measuredReviewCycleSampleSize = 2) =>
        new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            DateTimeOffset.Parse("2026-04-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-05-01T00:00:00Z"),
            [],
            3,
            2,
            1,
            0,
            10m,
            2m,
            1m,
            13m,
            4.5m,
            "Per-run estimate from ValueReportComputationOptions — not invoice truth.",
            12000m,
            900m,
            25000m,
            -13900m,
            -55.6m,
            tenantBaselineReviewCycleHours,
            tenantBaselineReviewCycleSource,
            tenantBaselineReviewCycleHours is null ? null : DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
            measuredAverageReviewCycleHoursForWindow,
            measuredReviewCycleSampleSize,
            reviewCycleBaselineProvenance,
            null,
            null,
            0,
            0,
            tenantBaselineManualPrepHoursPerReview,
            null);
}
