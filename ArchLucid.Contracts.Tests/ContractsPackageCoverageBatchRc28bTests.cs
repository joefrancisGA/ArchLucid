using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.Trust;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC28b package-coverage batch: Quick Scan catalogs, recommendation evidence links, value-report review-cycle
///     paragraphs, and cheap constant catalogs.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc28bTests
{
    [Theory]
    [InlineData("azure", QuickScanPrimaryEnvironment.Azure)]
    [InlineData("AWS", QuickScanPrimaryEnvironment.Aws)]
    [InlineData("GoogleCloud", QuickScanPrimaryEnvironment.GoogleCloud)]
    [InlineData("notsure", QuickScanPrimaryEnvironment.NotSure)]
    public void QuickScanPrimaryEnvironment_TryNormalize_maps_known(string raw, string expected)
    {
        QuickScanPrimaryEnvironment.TryNormalize(raw, out string normalized).Should().BeTrue();
        normalized.Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Saturn")]
    public void QuickScanPrimaryEnvironment_TryNormalize_rejects_unknown(string? raw)
    {
        QuickScanPrimaryEnvironment.TryNormalize(raw, out _).Should().BeFalse();
    }

    [Fact]
    public void QuickScanPrimaryEnvironment_ToContextLabel_uses_other_detail_and_display_labels()
    {
        QuickScanPrimaryEnvironment.ToContextLabel(QuickScanPrimaryEnvironment.Other, "edge colo")
            .Should().Be("Other (edge colo)");
        QuickScanPrimaryEnvironment.ToContextLabel(QuickScanPrimaryEnvironment.Aws, null)
            .Should().Be("AWS");
        QuickScanPrimaryEnvironment.ToContextLabel("CustomCanon", null)
            .Should().Be("CustomCanon");
    }

    [Theory]
    [InlineData("security", QuickScanArchitectureConcern.Security)]
    [InlineData("Cost", QuickScanArchitectureConcern.Cost)]
    [InlineData("operations", QuickScanArchitectureConcern.Operations)]
    public void QuickScanArchitectureConcern_TryNormalize_maps_known(string raw, string expected)
    {
        QuickScanArchitectureConcern.TryNormalize(raw, out string normalized).Should().BeTrue();
        normalized.Should().Be(expected);
        QuickScanArchitectureConcern.All.Should().Contain(expected);
    }

    [Fact]
    public void RecommendationSourceEvidenceLinksComposer_compose_parse_and_from_record()
    {
        string json = RecommendationSourceEvidenceLinksComposer.ComposeJson(
            [" finding-1 ", "finding-1", ""],
            ["decision-1"],
            ["artifact-1"]);

        json.Should().Contain("finding-1");
        json.Should().Contain(RecommendationSourceEvidenceLinksComposer.KindFinding);
        json.Should().Contain(RecommendationSourceEvidenceLinksComposer.KindManifestSection);

        IReadOnlyList<RecommendationSourceEvidenceLink> parsed =
            RecommendationSourceEvidenceLinksComposer.ParseJson(json);
        parsed.Should().HaveCount(3);

        RecommendationSourceEvidenceLinksComposer.ParseJson(null).Should().BeEmpty();
        RecommendationSourceEvidenceLinksComposer.ParseJson("{not-json").Should().BeEmpty();

        RecommendationRecord record = new()
        {
            SupportingFindingIdsJson = """["f-a"]""",
            SupportingDecisionIdsJson = "[]",
            SupportingArtifactIdsJson = "[]",
            SourceEvidenceLinksJson = "[]",
        };

        RecommendationSourceEvidenceLinksComposer.FromRecord(record)
            .Should().ContainSingle(l => l.Id == "f-a" && l.Kind == RecommendationSourceEvidenceLinksComposer.KindFinding);
    }

    [Fact]
    public void ValueReportReviewCycleSectionFormatter_GetParagraphs_covers_no_measurement_and_tenant_baseline()
    {
        ValueReportSnapshot emptyWindow = CreateSnapshot(
            ReviewCycleBaselineProvenance.NoMeasurementYet,
            tenantBaselineHours: null,
            measuredHours: null,
            delta: null,
            deltaPct: null);

        IReadOnlyList<ValueReportReviewCycleParagraph> none =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(emptyWindow);
        none.Should().Contain(p => p.Text.Contains("not yet available", StringComparison.OrdinalIgnoreCase));

        ValueReportSnapshot tenantBaseline = CreateSnapshot(
            ReviewCycleBaselineProvenance.TenantSuppliedViaSettings,
            tenantBaselineHours: 40m,
            measuredHours: 28m,
            delta: -12m,
            deltaPct: -30m,
            capturedUtc: DateTimeOffset.Parse("2026-08-01T00:00:00Z"),
            source: "settings");

        IReadOnlyList<ValueReportReviewCycleParagraph> paragraphs =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(
                tenantBaseline,
                SponsorRoiClaimDisposition.Warn);

        paragraphs.Should().Contain(p => p.Text.Contains("Baseline review cycle", StringComparison.OrdinalIgnoreCase));
        paragraphs.Should().Contain(p => p.Text.Contains("Measured review cycle", StringComparison.OrdinalIgnoreCase));
        paragraphs.Should().Contain(p => p.Text.Contains("Captured in baseline settings", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Constant_catalogs_expose_stable_keys()
    {
        FindingPropertyKeys.EnforcementTier.Should().Be("enforcementTier");
        FindingPropertyKeys.TechnologyLedgerRole.Should().Be("technologyLedgerRole");
        TrustEvidenceStatusValue.Available.Should().Be("Available");
        TrustEvidenceStatusValue.Missing.Should().Be("Missing");
        ProductLearningDispositionValues.Trusted.Should().Be("Trusted");
        ProductLearningDispositionValues.NeedsFollowUp.Should().Be("NeedsFollowUp");
        PolicyPackDryRunSupportedThresholdKeys.All.Should().HaveCount(4);
        PolicyPackDryRunSupportedThresholdKeys.All.Should().Contain(PolicyPackDryRunSupportedThresholdKeys.MaxCriticalFindings);
    }

    private static ValueReportSnapshot CreateSnapshot(
        ReviewCycleBaselineProvenance provenance,
        decimal? tenantBaselineHours,
        decimal? measuredHours,
        decimal? delta,
        decimal? deltaPct,
        DateTimeOffset? capturedUtc = null,
        string? source = null)
    {
        return new ValueReportSnapshot(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            DateTimeOffset.Parse("2026-07-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-08-01T00:00:00Z"),
            [],
            RunsCompletedCount: 1,
            ManifestsCommittedCount: 1,
            GovernanceEventsHandledCount: 0,
            DriftAlertEventsCaughtCount: 0,
            EstimatedArchitectHoursSavedFromManifests: 0m,
            EstimatedArchitectHoursSavedFromGovernanceEvents: 0m,
            EstimatedArchitectHoursSavedFromDriftEvents: 0m,
            EstimatedTotalArchitectHoursSaved: 0m,
            EstimatedLlmCostForWindowUsd: 0m,
            EstimatedLlmCostMethodologyNote: "n/a",
            AnnualizedHoursValueUsd: 0m,
            AnnualizedLlmCostUsd: 0m,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0m,
            NetAnnualizedValueVersusRoiBaselineUsd: 0m,
            RoiAnnualizedPercentVersusRoiBaseline: 0m,
            TenantBaselineReviewCycleHours: tenantBaselineHours,
            TenantBaselineReviewCycleSource: source,
            TenantBaselineReviewCycleCapturedUtc: capturedUtc,
            MeasuredAverageReviewCycleHoursForWindow: measuredHours,
            MeasuredReviewCycleSampleSize: measuredHours is null ? 0 : 2,
            ReviewCycleBaselineProvenance: provenance,
            ReviewCycleHoursDelta: delta,
            ReviewCycleHoursDeltaPercent: deltaPct,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: null,
            TenantBaselinePeoplePerReview: null);
    }
}
