using ArchLucid.Persistence.Tenancy.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialFunnelOperationalSummaryBuilderTests
{
    [Fact]
    public void Build_empty_summary_labels_cogs_as_estimated()
    {
        var summary = TrialFunnelOperationalSummaryBuilder.BuildEmpty(activeTrials: 3, periodDays: 30, comparePrevious: false);

        summary.ActiveSelfServiceTrials.Should().Be(3);
        summary.CogsBasisLabel.Should().Be("estimated");
        summary.EstimatedFirstReviewCogsUsdMid.Should().BeNull();
        summary.DataQuality.Should().NotBeNull();
        summary.Stages.Should().HaveCount(4);
    }

    [Fact]
    public void TryReadSignupToCommitSeconds_parses_audit_payload()
    {
        string json = """{"signupToCommitSeconds": 42.5}""";

        bool ok = TrialFunnelOperationalSummaryBuilder.TryReadSignupToCommitSeconds(json, out double seconds);

        ok.Should().BeTrue();
        seconds.Should().Be(42.5);
    }

    [Fact]
    public void TryReadSignupToCommitSeconds_returns_false_for_invalid_payloads()
    {
        TrialFunnelOperationalSummaryBuilder.TryReadSignupToCommitSeconds(null, out _).Should().BeFalse();
        TrialFunnelOperationalSummaryBuilder.TryReadSignupToCommitSeconds("not-json", out _).Should().BeFalse();
        TrialFunnelOperationalSummaryBuilder.TryReadSignupToCommitSeconds("""{"signupToCommitSeconds": 0}""", out _).Should().BeFalse();
    }

    [Fact]
    public void Build_computes_median_and_cogs_bands()
    {
        var summary = TrialFunnelOperationalSummaryBuilder.Build(
            activeTrials: 2,
            periodDays: 30,
            comparePrevious: false,
            signupAttempts: 10,
            signupFailures: 1,
            firstCommits: 4,
            conversions: 2,
            checkouts: 3,
            budgetCutoffs: 1,
            signupToCommitSeconds: [10.0, 20.0, 30.0],
            firstReviewCogsUsd: [1.5m, 2.0m, 4.0m],
            costRatesConfigured: true,
            cohortRows: []);

        summary.MedianSignupToFirstCommitSeconds.Should().Be(20.0);
        summary.EstimatedFirstReviewCogsUsdLow.Should().Be(1.5m);
        summary.EstimatedFirstReviewCogsUsdMid.Should().Be(2.0m);
        summary.EstimatedFirstReviewCogsUsdHigh.Should().Be(4.0m);
        summary.SignupAttempts30Days.Should().Be(10);
        summary.LlmBudgetCutoffEvents30Days.Should().Be(1);
    }

    [Fact]
    public void Build_returns_null_medians_when_signal_lists_empty()
    {
        var summary = TrialFunnelOperationalSummaryBuilder.Build(
            activeTrials: 0,
            periodDays: 30,
            comparePrevious: false,
            signupAttempts: 0,
            signupFailures: 0,
            firstCommits: 0,
            conversions: 0,
            checkouts: 0,
            budgetCutoffs: 0,
            signupToCommitSeconds: [],
            firstReviewCogsUsd: [],
            costRatesConfigured: false,
            cohortRows: []);

        summary.MedianSignupToFirstCommitSeconds.Should().BeNull();
        summary.EstimatedFirstReviewCogsUsdLow.Should().BeNull();
        summary.EstimatedFirstReviewCogsUsdMid.Should().BeNull();
        summary.EstimatedFirstReviewCogsUsdHigh.Should().BeNull();
    }
}
