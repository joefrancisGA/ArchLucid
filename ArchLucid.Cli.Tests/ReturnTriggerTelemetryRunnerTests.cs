using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReturnTriggerTelemetryRunnerTests
{
    [Fact]
    public void LoadDirectory_WithFixtureSessions_ParsesMultipleSchemas()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string ledgerDirectory = Path.Combine(
            repositoryRoot!,
            "fixtures",
            "principal-architect",
            "return-trigger-sessions");

        IReadOnlyList<ReturnTriggerTelemetrySessionRecord> records =
            ReturnTriggerTelemetrySessionParser.LoadDirectory(ledgerDirectory);

        records.Should().HaveCountGreaterThanOrEqualTo(4);
        records.Should().Contain(record => record.Schema == "archlucid.principal-architect-return-trigger.v1");
        records.Should().Contain(record => record.Schema == "archlucid.principal-architect-dismissal-log.v1");
        records.Should().Contain(record => record.Schema == "archlucid.pilot-reuse-cohort-tracker.v1");
        records.Should().Contain(record => record.Schema == "archlucid.principal-architect-session.v1");
    }

    [Fact]
    public void BuildMetrics_WithPositiveReuseSessions_ComputesFraction()
    {
        ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(null);
        List<ReturnTriggerTelemetrySessionRecord> records =
        [
            new() { ReuseIntent = "yes", ReturnTriggerCode = "R2" },
            new() { ReuseIntent = "maybe", ReturnTriggerCode = "R3" },
            new() { ReuseIntent = "no", ReturnTriggerCode = "R8" },
        ];

        ReturnTriggerTelemetryCohortMetrics metrics =
            ReturnTriggerTelemetryAggregator.BuildMetrics(records, rules);

        metrics.SessionCount.Should().Be(3);
        metrics.PositiveReuseIntentCount.Should().Be(2);
        metrics.PositiveReuseFraction.Should().BeApproximately(0.667, 0.001);
        metrics.MessagingReady.Should().BeTrue();
    }

    [Fact]
    public void EvaluateGuardrails_WithLowPositiveReuseFraction_Fails()
    {
        ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(null);
        ReturnTriggerTelemetryCohortMetrics metrics = new()
        {
            SessionCount = 4,
            PositiveReuseIntentCount = 1,
            PositiveReuseFraction = 0.25,
            MessagingReady = true,
        };

        ReturnTriggerTelemetryAggregator.EvaluateGuardrails(metrics, rules)
            .Should()
            .Be(ReturnTriggerTelemetryVerdict.Fail);
    }

    [Fact]
    public void Run_WithDefaultFixtures_PassesCohortGuardrails()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(null);
        ReturnTriggerTelemetryRunner runner = new();
        ReturnTriggerTelemetryReport report = runner.Run(
            repositoryRoot!,
            new ReturnTriggerTelemetryOptions(),
            rules);

        report.OverallVerdict.Should().Be(ReturnTriggerTelemetryVerdict.Pass);
        report.CohortMetrics.Should().NotBeNull();
        report.CohortMetrics!.SessionCount.Should().BeGreaterThanOrEqualTo(4);
        report.CohortMetrics.PositiveReuseFraction.Should().BeGreaterThan(0.33);
        report.Checks.Should().Contain(check =>
            check.Name == "Return-trigger fixture pack"
            && check.Verdict == ReturnTriggerTelemetryVerdict.Pass);
    }

    [Fact]
    public void Run_WithFailCohortLedger_ReturnsFailVerdict()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string tempLedger = Path.Combine(Path.GetTempPath(), $"archlucid-return-trigger-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempLedger);

        try
        {
            File.WriteAllText(
                Path.Combine(tempLedger, "fail-001.json"),
                """
                {
                  "schema": "archlucid.principal-architect-return-trigger.v1",
                  "sessionId": "fail-001",
                  "reuseIntent30Day": "no",
                  "returnTriggerCode": "R8"
                }
                """);

            File.WriteAllText(
                Path.Combine(tempLedger, "fail-002.json"),
                """
                {
                  "schema": "archlucid.principal-architect-return-trigger.v1",
                  "sessionId": "fail-002",
                  "reuseIntent30Day": "no",
                  "returnTriggerCode": "R8"
                }
                """);

            File.WriteAllText(
                Path.Combine(tempLedger, "fail-003.json"),
                """
                {
                  "schema": "archlucid.principal-architect-return-trigger.v1",
                  "sessionId": "fail-003",
                  "reuseIntent30Day": "no",
                  "returnTriggerCode": "R8"
                }
                """);

            ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(null);
            ReturnTriggerTelemetryRunner runner = new();
            ReturnTriggerTelemetryReport report = runner.Run(
                repositoryRoot!,
                new ReturnTriggerTelemetryOptions { LedgerDirectory = tempLedger },
                rules);

            report.OverallVerdict.Should().Be(ReturnTriggerTelemetryVerdict.Fail);
            report.CohortMetrics!.PositiveReuseFraction.Should().Be(0);
        }
        finally
        {
            if (Directory.Exists(tempLedger))
                Directory.Delete(tempLedger, recursive: true);
        }
    }
}
