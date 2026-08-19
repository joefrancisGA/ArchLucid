using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealModeSmokeOneLineSummaryFormatterTests
{
    [Fact]
    public void Format_Pass_IncludesRunIdAndTokens()
    {
        RealModeSmokeReport report = new()
        {
            AllPassed = true,
            RunId = "run-1",
            CorrelationId = "corr-1",
            FinalRunStatus = "ReadyForCommit",
            TotalLlmTokens = 42,
            Steps =
            [
                new RealModeSmokeStepResult { Name = "health-live", Passed = true, Detail = "ok" }
            ]
        };

        string line = RealModeSmokeOneLineSummaryFormatter.Format(report, "https://staging.archlucid.net");

        line.Should().StartWith("PASS ");
        line.Should().Contain("runId=run-1");
        line.Should().Contain("correlation=corr-1");
        line.Should().Contain("tokens=42");
        line.Should().Contain("failed=<none>");
    }

    [Fact]
    public void Format_Fail_IncludesFailedStep()
    {
        RealModeSmokeReport report = new()
        {
            AllPassed = false,
            Steps =
            [
                new RealModeSmokeStepResult { Name = "poll-ready", Passed = false, Detail = "timeout" }
            ]
        };

        string line = RealModeSmokeOneLineSummaryFormatter.Format(report, "https://staging.archlucid.net");

        line.Should().StartWith("FAIL ");
        line.Should().Contain("failed=poll-ready");
    }
}
