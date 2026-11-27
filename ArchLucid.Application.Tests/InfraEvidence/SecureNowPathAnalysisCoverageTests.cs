using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Analysis;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowPathAnalysisCoverageTests
{
    private static readonly DateTime Now = new(2026, 11, 27, 14, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(null, null, false, "unknown")]
    [InlineData(null, "retry", false, "pending")]
    [InlineData("succeeded", "succeeded", false, "unknown")]
    [InlineData("retry_exhausted", "failed", false, "failed")]
    [InlineData("succeeded", "succeeded", true, "complete")]
    public void Capture_and_analysis_are_independent(string? outcome, string? claimState, bool verified, string expected)
    {
        SecureNowAnalysisRecoveryJob? job = claimState is null ? null : new()
        {
            Outcome = outcome, DeadlineUtc = Now.AddMinutes(5),
        };
        AnalysisRecoveryClaim? claim = claimState is null ? null : new() { State = claimState, Attempts = 2 };
        AnalysisCoverageSummary coverage = SecureNowPathAnalysisCoverage.Evaluate(
            Capture(), job, claim, null, verified, false, false, false, Now, 24);

        Assert.Equal(expected, coverage.State);
        Assert.Equal(verified, coverage.CanAssertAbsence);
        Assert.Contains(coverage.Stages, stage => stage.Stage == "prior_snapshot_diff"
            && stage.State == (job is null ? "unknown" : "not_applicable"));

        if (verified)
            Assert.Equal("recovered", coverage.Recovery);
    }

    [Theory]
    [InlineData(true, false, false, "search_coverage_limited")]
    [InlineData(false, true, false, "path_evidence_incomplete")]
    [InlineData(false, false, true, "path_ranking_missing")]
    public void Any_gap_withholds_absence_even_when_previous_job_succeeded(
        bool limited, bool unevaluated, bool unranked, string reason)
    {
        AnalysisCoverageSummary coverage = SecureNowPathAnalysisCoverage.Evaluate(
            Capture(), new() { Outcome = "succeeded" }, new() { State = "succeeded" },
            null, true, limited, unevaluated, unranked, Now, 24);

        Assert.Equal("incomplete", coverage.State);
        Assert.Contains(reason, coverage.ReasonCodes);
        Assert.False(coverage.CanAssertAbsence);
    }

    [Fact]
    public void Historical_completion_does_not_establish_current_coverage()
    {
        AnalysisCoverageSummary coverage = SecureNowPathAnalysisCoverage.Evaluate(
            Capture(25), new() { Outcome = "succeeded" }, new() { State = "succeeded" }, null, true,
            false, false, false, Now, 24);

        Assert.Equal("complete", coverage.State);
        Assert.Equal("stale", coverage.Freshness);
        Assert.False(coverage.CanAssertAbsence);
    }

    [Fact]
    public void Stale_dependencies_and_safe_terminal_reasons_do_not_reuse_outputs_as_completion()
    {
        AnalysisCoverageSummary stale = SecureNowPathAnalysisCoverage.Evaluate(
            Capture(), new() { Outcome = "succeeded" }, new() { State = "succeeded" },
            "stale_path_outputs", false, false, false, false, Now, 24);
        AnalysisCoverageSummary failed = SecureNowPathAnalysisCoverage.Evaluate(
            Capture(), new() { Outcome = "failed" }, new()
            {
                State = "failed", CoverageReason = "inputs_changed_during_execution",
            },
            null, false, false, false, false, Now, 24);

        Assert.Equal("stale", stale.State);
        Assert.Contains("inputs_changed_during_execution", failed.ReasonCodes);
        Assert.Null(AnalysisCoverageReasons.ReadKnown("provider-private-text"));
        Assert.False(stale.CanAssertAbsence);
        Assert.False(failed.CanAssertAbsence);
    }

    private static AzureInventorySnapshotRecord Capture(int hoursOld = 1) => new()
    {
        CapturedUtc = Now.AddHours(-hoursOld),
        CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
        CompletenessScore = 1m,
        ContentHashSha256 = new byte[32],
    };
}
