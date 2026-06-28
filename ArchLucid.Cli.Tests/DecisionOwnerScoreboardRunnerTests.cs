using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DecisionOwnerScoreboardRunnerTests
{
    [Fact]
    public void LoadDirectory_WithSampleLedgers_ParsesOwnerFields()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string ledgerDirectory = Path.Combine(
            repositoryRoot!,
            "fixtures",
            "decision-owner-scoreboard",
            "sample-ledgers");

        IReadOnlyList<DecisionOwnerLedgerRecord> records =
            DecisionOwnerScoreboardParser.LoadDirectory(ledgerDirectory);

        records.Should().HaveCountGreaterThanOrEqualTo(2);
        records.SelectMany(static record => record.Decisions)
            .Should()
            .Contain(decision => !string.IsNullOrWhiteSpace(decision.DecisionOwner));
    }

    [Fact]
    public void BuildRows_WithSampleLedgers_ResolvesAccountabilityStatuses()
    {
        DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(null);
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string ledgerDirectory = Path.Combine(
            repositoryRoot!,
            "fixtures",
            "decision-owner-scoreboard",
            "sample-ledgers");

        IReadOnlyList<DecisionOwnerLedgerRecord> records =
            DecisionOwnerScoreboardParser.LoadDirectory(ledgerDirectory);
        IReadOnlyList<DecisionOwnerScoreboardRow> rows =
            DecisionOwnerScoreboardNormalizer.BuildRows(records, rules, DateTime.UtcNow);

        rows.Should().Contain(row => row.AccountabilityStatus == "owned-and-resolved");
        rows.Should().Contain(row => row.AccountabilityStatus == "not-applicable");
    }

    [Fact]
    public void Run_WithDefaultFixtures_PassesOrWarnsAccountability()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(null);
        DecisionOwnerScoreboardRunner runner = new();
        DecisionOwnerScoreboardReport report = runner.Run(
            repositoryRoot!,
            new DecisionOwnerScoreboardOptions(),
            rules);

        report.OverallVerdict.Should().BeOneOf(
            DecisionOwnerScoreboardVerdict.Pass,
            DecisionOwnerScoreboardVerdict.Warn);
        report.OperatorMarkdown.Should().Contain("Decision-owner accountability scoreboard");
        report.SponsorMarkdown.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Run_WithUnownedDecision_ReturnsFailVerdict()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string tempLedger = Path.Combine(Path.GetTempPath(), $"archlucid-owner-scoreboard-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempLedger);

        try
        {
            File.WriteAllText(
                Path.Combine(tempLedger, "fail-ledger.json"),
                """
                {
                  "schema": "archlucid.pilot-decision-ledger.v1",
                  "runId": "bbbbbbbb-2222-2222-2222-222222222222",
                  "decisionsUnderReview": [
                    {
                      "decisionId": "d1",
                      "title": "Unowned decision",
                      "statusBeforeReview": "pending-approval"
                    }
                  ],
                  "decisionChanges": [
                    {
                      "decisionId": "d1",
                      "changedBecauseOfArchLucidFinding": true,
                      "findingId": "f1",
                      "evidenceChainId": "e1",
                      "attributionConfidence": "high"
                    }
                  ],
                  "noDecisionChangesConfirmed": false
                }
                """);

            DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(null);
            DecisionOwnerScoreboardRunner runner = new();
            DecisionOwnerScoreboardReport report = runner.Run(
                repositoryRoot!,
                new DecisionOwnerScoreboardOptions { LedgerDirectory = tempLedger },
                rules);

            report.OverallVerdict.Should().Be(DecisionOwnerScoreboardVerdict.Fail);
            report.Rows.Should().Contain(row => row.AccountabilityStatus == "unowned");
            report.SponsorMarkdown.Should().Contain("Sponsor render withheld");
        }
        finally
        {
            if (Directory.Exists(tempLedger))
                Directory.Delete(tempLedger, recursive: true);
        }
    }

    [Fact]
    public void Run_WithOverdueDecision_ReturnsFailVerdict()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string tempLedger = Path.Combine(Path.GetTempPath(), $"archlucid-owner-scoreboard-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempLedger);

        try
        {
            File.WriteAllText(
                Path.Combine(tempLedger, "overdue-ledger.json"),
                """
                {
                  "schema": "archlucid.pilot-decision-ledger.v1",
                  "runId": "dddddddd-4444-4444-4444-444444444444",
                  "decisionsUnderReview": [
                    {
                      "decisionId": "d1",
                      "title": "Overdue remediation",
                      "statusBeforeReview": "pending-approval",
                      "decisionOwner": "workload-security-lead",
                      "ownerOutcome": "deferred",
                      "remediationDueUtc": "2020-01-01T00:00:00Z"
                    }
                  ],
                  "decisionChanges": [],
                  "noDecisionChangesConfirmed": false
                }
                """);

            DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(null);
            DecisionOwnerScoreboardRunner runner = new();
            DecisionOwnerScoreboardReport report = runner.Run(
                repositoryRoot!,
                new DecisionOwnerScoreboardOptions { LedgerDirectory = tempLedger },
                rules);

            report.OverallVerdict.Should().Be(DecisionOwnerScoreboardVerdict.Fail);
            report.Rows.Should().Contain(row => row.AccountabilityStatus == "owned-overdue");
        }
        finally
        {
            if (Directory.Exists(tempLedger))
                Directory.Delete(tempLedger, recursive: true);
        }
    }
}
