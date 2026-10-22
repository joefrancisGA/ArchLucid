using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC28e package-coverage batch: review-cycle formatter remaining branches, manifest JSON hashers,
///     and agent evaluation summary JSON round-trip.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc28eTests
{
    [Fact]
    public void ValueReportReviewCycleSectionFormatter_GetParagraphs_DefaultedFromRoiModelOptions_includes_disclaimer()
    {
        ValueReportSnapshot snapshot = CreateMeasuredSnapshot(
            ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions,
            tenantBaselineHours: 48m,
            measuredHours: 36m,
            delta: -12m,
            deltaPct: -25m);

        IReadOnlyList<ValueReportReviewCycleParagraph> paragraphs =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(snapshot, SponsorRoiClaimDisposition.Warn);

        paragraphs.Should().Contain(p =>
            p.Text.Contains("default from PILOT_ROI_MODEL.md", StringComparison.OrdinalIgnoreCase));
        paragraphs.Should().Contain(p =>
            p.Text.Contains("illustrative, not customer-specific", StringComparison.OrdinalIgnoreCase));
        paragraphs.Should().Contain(p => p.Text.Contains("Directional delta", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ValueReportReviewCycleSectionFormatter_GetParagraphs_Pass_disposition_formats_sponsor_delta()
    {
        ValueReportSnapshot snapshot = CreateMeasuredSnapshot(
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            tenantBaselineHours: 40m,
            measuredHours: 32m,
            delta: -8m,
            deltaPct: -20m);

        IReadOnlyList<ValueReportReviewCycleParagraph> paragraphs =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(snapshot, SponsorRoiClaimDisposition.Pass);

        paragraphs.Should().ContainSingle(p =>
            p.Text.Contains("Delta: -8 h saved per run (-20% improvement)", StringComparison.Ordinal));
    }

    [Fact]
    public void ValueReportReviewCycleSectionFormatter_GetParagraphs_Hold_disposition_marks_internal_only()
    {
        ValueReportSnapshot snapshot = CreateMeasuredSnapshot(
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            tenantBaselineHours: 40m,
            measuredHours: 32m,
            delta: -8m,
            deltaPct: -20m);

        IReadOnlyList<ValueReportReviewCycleParagraph> paragraphs =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(snapshot, SponsorRoiClaimDisposition.Hold);

        paragraphs.Should().ContainSingle(p =>
            p.Text.Contains("internal planning only", StringComparison.OrdinalIgnoreCase));
        paragraphs.Should().ContainSingle(p =>
            p.Text.Contains("HOLD: not sponsor-quotable", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ValueReportReviewCycleSectionFormatter_GetParagraphs_Warn_disposition_without_percent()
    {
        ValueReportSnapshot snapshot = CreateMeasuredSnapshot(
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            tenantBaselineHours: 40m,
            measuredHours: 32m,
            delta: -8m,
            deltaPct: null);

        IReadOnlyList<ValueReportReviewCycleParagraph> paragraphs =
            ValueReportReviewCycleSectionFormatter.GetParagraphs(snapshot, SponsorRoiClaimDisposition.Warn);

        paragraphs.Should().ContainSingle(p =>
            p.Text.Contains("Directional delta", StringComparison.OrdinalIgnoreCase));
        paragraphs.Should().ContainSingle(p =>
            p.Text.Contains("WARN: not customer-specific", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ValueReportReviewCycleSectionFormatter_AppendMarkdownSection_emits_pass_delta_and_signup_metadata()
    {
        ValueReportSnapshot snapshot = CreateMeasuredSnapshot(
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            tenantBaselineHours: 40m,
            measuredHours: 30m,
            delta: -10m,
            deltaPct: -25m,
            capturedUtc: DateTimeOffset.Parse("2026-06-01T12:00:00Z"),
            source: "baseline_settings: sponsor supplied");

        StringBuilder sb = new();
        ValueReportReviewCycleSectionFormatter.AppendMarkdownSection(sb, snapshot, SponsorRoiClaimDisposition.Pass);

        string markdown = sb.ToString();
        markdown.Should().StartWith("## Review-cycle delta (before vs measured)");
        markdown.Should().Contain("Delta: -10 h saved per run (-25% improvement)");
        markdown.Should().Contain("Captured at signup (UTC)");
        markdown.Should().Contain("Source note: sponsor supplied");
        markdown.Should().NotContain("Review-cycle delta (before vs measured)\r\n\r\nReview-cycle delta");
    }

    [Fact]
    public void ValueReportReviewCycleSectionFormatter_GetParagraphs_throws_when_snapshot_null()
    {
        FluentActions
            .Invoking(() => ValueReportReviewCycleSectionFormatter.GetParagraphs(null!, SponsorRoiClaimDisposition.Pass))
            .Should()
            .Throw<ArgumentNullException>()
            .WithParameterName("snapshot");
    }

    [Fact]
    public void GoldenManifestFingerprint_ComputeContentSha256HexFromManifestJson_throws_for_blank_json()
    {
        FluentActions
            .Invoking(() => GoldenManifestFingerprint.ComputeContentSha256HexFromManifestJson("  "))
            .Should()
            .Throw<ArgumentException>()
            .WithParameterName("manifestJson");
    }

    [Fact]
    public void GoldenManifestFingerprint_json_hashers_ignore_run_identity_drift()
    {
        GoldenManifest left = BaseManifest("run-left");
        GoldenManifest right = BaseManifest("run-right");
        right.Metadata!.CreatedUtc = left.Metadata!.CreatedUtc.AddDays(3);
        right.Metadata.DecisionTraceIds = ["bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"];

        string leftJson = JsonSerializer.Serialize(left, ContractJson.Default);
        string rightJson = JsonSerializer.Serialize(right, ContractJson.Default);

        GoldenManifestFingerprint.ComputeContentSha256HexFromManifestJson(leftJson)
            .Should()
            .Be(GoldenManifestFingerprint.ComputeContentSha256HexFromManifestJson(rightJson));
        GoldenManifestFingerprint.ComputeSha256HexFromManifestJson(leftJson)
            .Should()
            .NotBe(GoldenManifestFingerprint.ComputeSha256HexFromManifestJson(rightJson));
    }

    [Fact]
    public void AgentOutputEvaluationSummary_round_trips_json_with_recorded_and_advisory_perspectives()
    {
        DateTime evaluatedUtc = new(2026, 8, 10, 18, 30, 0, DateTimeKind.Utc);
        AgentOutputEvaluationSummary original = new()
        {
            RunId = "run-json-roundtrip",
            EvaluatedAtUtc = evaluatedUtc,
            Recorded = new AgentOutputEvaluationPerspective
            {
                Authority = "recorded",
                TracesSkippedCount = 1,
                AverageStructuralCompletenessRatio = 0.75,
                AggregateQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            },
            AdvisoryCurrent = new AgentOutputEvaluationPerspective
            {
                Authority = "advisoryCurrent",
                TracesSkippedCount = 0,
                AverageStructuralCompletenessRatio = 0.9,
                AggregateQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            },
        };

        string json = JsonSerializer.Serialize(original, ContractJson.Default);
        AgentOutputEvaluationSummary? roundTrip = JsonSerializer.Deserialize<AgentOutputEvaluationSummary>(json, ContractJson.Default);

        roundTrip.Should().NotBeNull();
        roundTrip!.RunId.Should().Be("run-json-roundtrip");
        roundTrip.EvaluatedAtUtc.Should().Be(evaluatedUtc);
        roundTrip.Recorded!.Authority.Should().Be("recorded");
        roundTrip.AdvisoryCurrent.Authority.Should().Be("advisoryCurrent");
    }

    private static ValueReportSnapshot CreateMeasuredSnapshot(
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
            RunsCompletedCount: 2,
            ManifestsCommittedCount: 2,
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

    private static GoldenManifest BaseManifest(string runId)
    {
        return new GoldenManifest
        {
            RunId = runId,
            SystemName = "Coverage Sys",
            Services =
            [
                new ManifestService
                {
                    ServiceId = "svc-b",
                    ServiceName = "Orders",
                    Tags = ["prod"],
                },
                new ManifestService
                {
                    ServiceId = "svc-a",
                    ServiceName = "Gateway",
                    Tags = ["edge"],
                },
            ],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance { RiskClassification = "Moderate" },
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v1-rc28e",
                ChangeDescription = "stable",
                CreatedUtc = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                DecisionTraceIds = ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            },
        };
    }
}
