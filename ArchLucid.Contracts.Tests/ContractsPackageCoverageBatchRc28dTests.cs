using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC28d package-coverage batch: governed coverage metric, ROI pricing/scope labels, finding JSON aliases,
///     failure commit classifier, and baseline review-cycle markers.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc28dTests
{
    [Fact]
    public void GovernedFindingCoverageMetric_Compute_and_NotAvailable()
    {
        GovernedFindingCoverageMetric unavailable = GovernedFindingCoverageMetric.Compute(0, 0, 0, 0, 0);
        unavailable.IsAvailable.Should().BeFalse();
        unavailable.GovernedPercentage.Should().BeNull();

        GovernedFindingCoverageMetric metric = GovernedFindingCoverageMetric.Compute(
            totalDecisionGradeCount: 4,
            governedCount: 1,
            advisoryCount: 3,
            withPolicyRuleCount: 2,
            withEvidenceRefsCount: 1);

        metric.IsAvailable.Should().BeTrue();
        metric.GovernedPercentage.Should().Be(25.0);
        metric.GovernedCount.Should().Be(1);
        metric.AdvisoryCount.Should().Be(3);

        GovernedFindingCoverageMetric.NotAvailable().IsAvailable.Should().BeFalse();
    }

    [Theory]
    [InlineData(1.0, "Retail")]
    [InlineData(0.85, "EA-adjusted")]
    public void ExecutiveRoiSavingsPricingBasis_Resolve_ea_multiplier(decimal multiplier, string expected)
    {
        ExecutiveRoiSavingsPricingBasis.Resolve(multiplier).Should().Be(expected);
    }

    [Theory]
    [InlineData(1.0, true, false, "Uploaded actual/amortized")]
    [InlineData(0.9, false, false, "EA-adjusted")]
    [InlineData(1.0, false, true, "Heuristic fallback")]
    [InlineData(1.0, false, false, "Retail")]
    public void ExecutiveRoiSavingsPricingBasis_Resolve_evidence_signals(
        decimal multiplier,
        bool uploaded,
        bool heuristic,
        string expected)
    {
        ExecutiveRoiSavingsPricingBasis.Resolve(multiplier, uploaded, heuristic).Should().Be(expected);
    }

    [Fact]
    public void RoiSponsorFacingScopeDescriptions_window_formatters()
    {
        DateTimeOffset from = DateTimeOffset.Parse("2026-07-01T00:00:00Z");
        DateTimeOffset to = DateTimeOffset.Parse("2026-07-31T23:59:59Z");

        string valueReport = RoiSponsorFacingScopeDescriptions.ForValueReportWindow(from, to);
        valueReport.Should().Contain(RoiSponsorFacingScopeDescriptions.ValueReportActivityWindowGeneric);
        valueReport.Should().Contain(from.ToString("O"));

        string pilot = RoiSponsorFacingScopeDescriptions.ForPilotScorecardWindow(from, to);
        pilot.Should().Contain(RoiSponsorFacingScopeDescriptions.PilotScorecardUtcWindowGeneric);
        pilot.Should().Contain(to.ToString("O"));
    }

    [Theory]
    [InlineData("title", "Prefer private endpoints.")]
    [InlineData("detail", "Prefer private endpoints.")]
    [InlineData("recommendation", "Prefer private endpoints.")]
    public void ArchitectureFindingJsonConverter_reads_message_aliases(string propertyName, string expected)
    {
        string json =
            $$"""
              {
                "severity": "Info",
                "category": "Cost",
                "{{propertyName}}": "{{expected}}"
              }
              """;

        JsonSerializerOptions options = new(JsonSerializerDefaults.Web)
        {
            Converters = { new ArchitectureFindingJsonConverter() },
        };

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);
        finding.Should().NotBeNull();
        finding!.Message.Should().Be(expected);
        finding.Severity.Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void FindingEngineFailureCommitClassifier_advisory_when_compliance_pack_optional()
    {
        FindingEngineFailure security = new()
        {
            EngineType = "SecurityEngine",
            Category = "Security",
            ErrorMessage = "timeout",
            ExceptionType = "TimeoutException",
        };
        FindingEngineFailure compliance = new()
        {
            EngineType = "ComplianceEngine",
            Category = "Compliance",
            ErrorMessage = "pack missing",
            ExceptionType = "InvalidOperationException",
        };
        FindingEngineFailure cost = new()
        {
            EngineType = "CostEngine",
            Category = "Cost",
            ErrorMessage = "sku miss",
            ExceptionType = "Exception",
        };

        FindingEngineFailureCommitClassifier.IsCommitBlocking(security).Should().BeTrue();
        FindingEngineFailureCommitClassifier.IsCommitBlocking(compliance, compliancePackRequired: true).Should().BeTrue();
        FindingEngineFailureCommitClassifier.IsCommitBlocking(compliance, compliancePackRequired: false).Should().BeFalse();
        FindingEngineFailureCommitClassifier.IsCommitBlocking(cost).Should().BeFalse();

        FindingEngineFailureCommitClassifier
            .HasCommitBlockingFailures([security, cost])
            .Should()
            .BeTrue();
        FindingEngineFailureCommitClassifier
            .HasCommitBlockingFailures([compliance, cost], compliancePackRequired: false)
            .Should()
            .BeFalse();

        IReadOnlyList<FindingEngineFailure> advisory = FindingEngineFailureCommitClassifier.SelectAdvisoryFailures(
            [security, compliance, cost, null!],
            compliancePackRequired: false);

        advisory.Should().HaveCount(2);
        advisory.Should().Contain(f => f.Category == "Compliance");
        advisory.Should().Contain(f => f.Category == "Cost");
    }

    [Theory]
    [InlineData(null, false, null)]
    [InlineData("baseline_settings", true, null)]
    [InlineData("baseline_settings: sponsor note", true, "sponsor note")]
    [InlineData("signup prose", false, "signup prose")]
    public void BaselineReviewCycleSourceMarkers_parse_and_format(
        string? source,
        bool indicatesOperator,
        string? displayNote)
    {
        BaselineReviewCycleSourceMarkers.IndicatesTenantCapturedViaOperatorSettings(source)
            .Should()
            .Be(indicatesOperator);
        BaselineReviewCycleSourceMarkers.FormatReviewCycleSourceNoteForDisplay(source)
            .Should()
            .Be(displayNote);
    }

    [Fact]
    public void BaselineReviewCycleSourceMarkers_FormatOperatorSettingsPersistence()
    {
        BaselineReviewCycleSourceMarkers.FormatOperatorSettingsPersistence(null)
            .Should()
            .Be(BaselineReviewCycleSourceMarkers.OperatorSettingsToken);
        BaselineReviewCycleSourceMarkers.FormatOperatorSettingsPersistence("  note  ")
            .Should()
            .Be("baseline_settings:note");
    }
}
