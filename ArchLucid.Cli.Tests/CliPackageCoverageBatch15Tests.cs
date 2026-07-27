using System.Text.Json;

using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Stack;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch15Tests
{
    private static readonly DateTime FixedUtcNow = new(2026, 7, 26, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void AggregateTriggers_EvidenceFileOnly_CountsSowAndManualHandoff()
    {
        string repositoryRoot = CreateTempDirectory();

        try
        {
            string evidenceDirectory = Path.Combine(repositoryRoot, "artifacts", "itsm");
            Directory.CreateDirectory(evidenceDirectory);
            File.WriteAllText(
                Path.Combine(evidenceDirectory, "connector-pull-forward-evidence.json"),
                """
                {
                  "schema": "archlucid.connector-pull-forward-evidence.v1",
                  "signals": {
                    "connectorPrimaryBlockerPilotCount": 0,
                    "sowContingentOnConnectorCount": 2,
                    "manualHandoffDominatesSecondReviewCount": 3
                  }
                }
                """);

            ItsmPullForwardOptions options = new()
            {
                LedgerDirectory = Path.Combine(repositoryRoot, "no-such-ledger-dir"),
            };

            ItsmPullForwardTriggerCounts triggers =
                ItsmPullForwardEvidenceParser.AggregateTriggers(repositoryRoot, options);

            triggers.ConnectorPrimaryBlockerPilotCount.Should().Be(0);
            triggers.SowContingentOnConnectorCount.Should().Be(2);
            triggers.ManualHandoffDominatesSecondReviewCount.Should().Be(3);
        }
        finally
        {
            DeleteTempDirectory(repositoryRoot);
        }
    }

    [Fact]
    public void AggregateTriggers_LedgerWithPaidPilotFalse_SkipsBlockerScan()
    {
        string repositoryRoot = CreateTempDirectory();

        try
        {
            string ledgerDirectory = Path.Combine(repositoryRoot, "ledgers");
            Directory.CreateDirectory(ledgerDirectory);
            File.WriteAllText(
                Path.Combine(ledgerDirectory, "a.json"),
                """
                {
                  "schema": "archlucid.paid-pilot-evidence-ledger.v1",
                  "paidPilot": false,
                  "blockers": [ { "category": "connector-gap" } ]
                }
                """);

            ItsmPullForwardOptions options = new() { LedgerDirectory = ledgerDirectory };

            ItsmPullForwardTriggerCounts triggers =
                ItsmPullForwardEvidenceParser.AggregateTriggers(repositoryRoot, options);

            triggers.ConnectorPrimaryBlockerPilotCount.Should().Be(0);
        }
        finally
        {
            DeleteTempDirectory(repositoryRoot);
        }
    }

    [Fact]
    public void AggregateTriggers_LedgerMissingBlockersProperty_TreatsAsNoTriggers()
    {
        string repositoryRoot = CreateTempDirectory();

        try
        {
            string ledgerDirectory = Path.Combine(repositoryRoot, "ledgers");
            Directory.CreateDirectory(ledgerDirectory);
            File.WriteAllText(
                Path.Combine(ledgerDirectory, "a.json"),
                """{"schema": "archlucid.paid-pilot-evidence-ledger.v1"}""");

            ItsmPullForwardOptions options = new() { LedgerDirectory = ledgerDirectory };

            ItsmPullForwardTriggerCounts triggers =
                ItsmPullForwardEvidenceParser.AggregateTriggers(repositoryRoot, options);

            triggers.ConnectorPrimaryBlockerPilotCount.Should().Be(0);
        }
        finally
        {
            DeleteTempDirectory(repositoryRoot);
        }
    }

    [Fact]
    public void AggregateTriggers_InvalidJsonLedgerFile_IsSkipped()
    {
        string repositoryRoot = CreateTempDirectory();

        try
        {
            string ledgerDirectory = Path.Combine(repositoryRoot, "ledgers");
            Directory.CreateDirectory(ledgerDirectory);
            File.WriteAllText(Path.Combine(ledgerDirectory, "bad.json"), "{ not valid json");
            File.WriteAllText(
                Path.Combine(ledgerDirectory, "good.json"),
                """
                {
                  "schema": "archlucid.paid-pilot-evidence-ledger.v1",
                  "blockers": [ { "category": "connector-gap" } ]
                }
                """);

            ItsmPullForwardOptions options = new() { LedgerDirectory = ledgerDirectory };

            ItsmPullForwardTriggerCounts triggers =
                ItsmPullForwardEvidenceParser.AggregateTriggers(repositoryRoot, options);

            triggers.ConnectorPrimaryBlockerPilotCount.Should().Be(1);
        }
        finally
        {
            DeleteTempDirectory(repositoryRoot);
        }
    }

    [Fact]
    public void CountLedgerFiles_CountsJsonFilesRecursively()
    {
        string repositoryRoot = CreateTempDirectory();

        try
        {
            string ledgerDirectory = Path.Combine(repositoryRoot, "ledgers");
            string nestedDirectory = Path.Combine(ledgerDirectory, "nested");
            Directory.CreateDirectory(nestedDirectory);
            File.WriteAllText(Path.Combine(ledgerDirectory, "a.json"), "{}");
            File.WriteAllText(Path.Combine(nestedDirectory, "b.json"), "{}");
            File.WriteAllText(Path.Combine(nestedDirectory, "c.txt"), "not json");

            ItsmPullForwardOptions options = new() { LedgerDirectory = ledgerDirectory };

            ItsmPullForwardEvidenceParser.CountLedgerFiles(repositoryRoot, options).Should().Be(2);
        }
        finally
        {
            DeleteTempDirectory(repositoryRoot);
        }
    }

    [Fact]
    public void DeriveOverallVerdict_EmptyRecords_ReturnsWarn()
    {
        List<DecisionOwnerScoreboardRow> rows = [];
        List<DecisionOwnerLedgerRecord> records = [];
        DecisionOwnerScoreboardRules rules = new();

        DecisionOwnerScoreboardNormalizer.DeriveOverallVerdict(rows, records, rules)
            .Should()
            .Be(DecisionOwnerScoreboardVerdict.Warn);
    }

    [Fact]
    public void DeriveOverallVerdict_NoDecisionChangesConfirmedWithNoRows_ReturnsPass()
    {
        List<DecisionOwnerScoreboardRow> rows = [];
        List<DecisionOwnerLedgerRecord> records = [new() { NoDecisionChangesConfirmed = true }];
        DecisionOwnerScoreboardRules rules = new();

        DecisionOwnerScoreboardNormalizer.DeriveOverallVerdict(rows, records, rules)
            .Should()
            .Be(DecisionOwnerScoreboardVerdict.Pass);
    }

    [Fact]
    public void DeriveOverallVerdict_OwnedPendingOnly_ReturnsWarn()
    {
        List<DecisionOwnerScoreboardRow> rows =
        [
            new() { DecisionId = "d1", AccountabilityStatus = "owned-pending" },
        ];
        List<DecisionOwnerLedgerRecord> records = [new()];
        DecisionOwnerScoreboardRules rules = new();

        DecisionOwnerScoreboardNormalizer.DeriveOverallVerdict(rows, records, rules)
            .Should()
            .Be(DecisionOwnerScoreboardVerdict.Warn);
    }

    [Fact]
    public void DeriveOverallVerdict_AttributedChangeMissingOutcome_ReturnsFail()
    {
        List<DecisionOwnerScoreboardRow> rows = [];
        List<DecisionOwnerLedgerRecord> records =
        [
            new()
            {
                Decisions = [new DecisionOwnerLedgerDecision { DecisionId = "d1", DecisionOwner = "alice" }],
                Changes = [new DecisionOwnerLedgerChange { DecisionId = "d1", ChangedBecauseOfArchLucidFinding = true }],
            },
        ];
        DecisionOwnerScoreboardRules rules = new() { ResolvedOwnerOutcomes = ["accepted"] };

        DecisionOwnerScoreboardNormalizer.DeriveOverallVerdict(rows, records, rules)
            .Should()
            .Be(DecisionOwnerScoreboardVerdict.Fail);
    }

    [Fact]
    public void BuildOperatorMarkdown_IncludesRowDetailSection()
    {
        DecisionOwnerScoreboardReport report = new()
        {
            GeneratedUtc = FixedUtcNow,
            Rows = [new DecisionOwnerScoreboardRow { DecisionId = "d1", Title = "Title A", AccountabilityStatus = "owned-pending" }],
        };

        string markdown = DecisionOwnerScoreboardNormalizer.BuildOperatorMarkdown(report, DecisionOwnerScoreboardVerdict.Warn);

        markdown.Should().Contain("## Row detail");
        markdown.Should().Contain("### d1 — Title A");
    }

    [Fact]
    public void BuildSponsorMarkdown_WithholdsRenderOnFailVerdict()
    {
        DecisionOwnerScoreboardReport report = new()
        {
            GeneratedUtc = FixedUtcNow,
            Rows = [new DecisionOwnerScoreboardRow { DecisionId = "d1", Title = "Title A", AccountabilityStatus = "unowned" }],
        };

        string markdown = DecisionOwnerScoreboardNormalizer.BuildSponsorMarkdown(report, DecisionOwnerScoreboardVerdict.Fail);

        markdown.Should().Contain("Sponsor render withheld");
        markdown.Should().NotContain("Title A");
    }

    [Fact]
    public void BuildMetrics_EmptyRecords_ReturnsZeroedMetrics()
    {
        List<ReturnTriggerTelemetrySessionRecord> records = [];
        ReturnTriggerTelemetryRules rules = new();

        ReturnTriggerTelemetryCohortMetrics metrics = ReturnTriggerTelemetryAggregator.BuildMetrics(records, rules);

        metrics.SessionCount.Should().Be(0);
        metrics.PositiveReuseIntentCount.Should().Be(0);
        metrics.PositiveReuseFraction.Should().Be(0);
        metrics.TopReturnTriggerCode.Should().Be("none");
        metrics.TopDismissalTriggerCode.Should().Be("none");
        metrics.MessagingReady.Should().BeFalse();
    }

    [Fact]
    public void BuildMetrics_RejectsNullRecords()
    {
        Action act = () => ReturnTriggerTelemetryAggregator.BuildMetrics(null!, new ReturnTriggerTelemetryRules());

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void BuildMetrics_ComputesDismissalCountsAndTopReturnTriggerCode()
    {
        List<ReturnTriggerTelemetrySessionRecord> records =
        [
            new() { ReuseIntent = "yes", ReturnTriggerCode = "R2", DismissalObserved = true },
            new() { ReuseIntent = "yes", ReturnTriggerCode = "R2", DismissalObserved = false },
            new() { ReuseIntent = "no", ReturnTriggerCode = "R8", DismissalObserved = true },
        ];
        ReturnTriggerTelemetryRules rules = new() { PositiveReuseIntents = ["yes"] };

        ReturnTriggerTelemetryCohortMetrics metrics = ReturnTriggerTelemetryAggregator.BuildMetrics(records, rules);

        metrics.DismissalObservedCount.Should().Be(2);
        metrics.PositiveReuseIntentCount.Should().Be(2);
        metrics.ExplicitReturnTriggerCount.Should().Be(3);
        metrics.TopReturnTriggerCode.Should().Be("R2");
    }

    [Fact]
    public void EvaluateGuardrails_ZeroSessions_ReturnsWarn()
    {
        ReturnTriggerTelemetryCohortMetrics metrics = new() { SessionCount = 0 };
        ReturnTriggerTelemetryRules rules = new();

        ReturnTriggerTelemetryAggregator.EvaluateGuardrails(metrics, rules)
            .Should()
            .Be(ReturnTriggerTelemetryVerdict.Warn);
    }

    [Fact]
    public void EvaluateGuardrails_BelowMinSessionsThreshold_ReturnsWarn()
    {
        ReturnTriggerTelemetryCohortMetrics metrics = new()
        {
            SessionCount = 2,
            PositiveReuseFraction = 1.0,
            MessagingReady = false,
        };
        ReturnTriggerTelemetryRules rules = new() { MinSessionsForMessaging = 3 };

        ReturnTriggerTelemetryAggregator.EvaluateGuardrails(metrics, rules)
            .Should()
            .Be(ReturnTriggerTelemetryVerdict.Warn);
    }

    [Fact]
    public void ResolveRoiBasisStatus_NoSourcesNoClaim_ReturnsNotCollected()
    {
        using JsonDocument document = JsonDocument.Parse("{}");

        PilotProofPacketCommercialReadinessBuilder.ResolveRoiBasisStatus(document.RootElement)
            .Should()
            .Be("not_collected");
    }

    [Fact]
    public void ResolveRoiBasisStatus_WithSources_ReturnsClassified()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"roiMetricSources": [{"metricKey": "hours"}]}""");

        PilotProofPacketCommercialReadinessBuilder.ResolveRoiBasisStatus(document.RootElement)
            .Should()
            .Be("classified");
    }

    [Fact]
    public void ResolveRoiBasisStatus_UnsourcedClaim_ReturnsHoldMissingSources()
    {
        using JsonDocument document = JsonDocument.Parse("""{"estimatedUsdSavings": 500}""");

        PilotProofPacketCommercialReadinessBuilder.ResolveRoiBasisStatus(document.RootElement)
            .Should()
            .Be("hold_missing_sources");
    }

    [Fact]
    public void HasUnsourcedRoiClaim_LowConfidence_ReturnsTrue()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"proofPackageCompleteness": {"roiEvidenceConfidence": "Low"}}""");

        PilotProofPacketCommercialReadinessBuilder.HasUnsourcedRoiClaim(document.RootElement).Should().BeTrue();
    }

    [Fact]
    public void ResolveProofDisposition_DeferredScopeWithStrictSatisfied_ReturnsDeferredScope()
    {
        using JsonDocument document = JsonDocument.Parse("{}");

        string disposition = PilotProofPacketCommercialReadinessBuilder.ResolveProofDisposition(
            document.RootElement,
            demoWarning: false,
            pilotStrictSatisfied: true,
            roiBasisStatus: "classified",
            deferredScopePresent: true,
            dataConsistencyDisposition: "PASS",
            roiFreshnessDisposition: "PASS",
            explanationConfidenceDisposition: "PASS");

        disposition.Should().Be("DEFERRED_SCOPE");
    }

    [Fact]
    public void ResolveProofDisposition_ExplanationConfidenceWarn_ReturnsWarn()
    {
        using JsonDocument document = JsonDocument.Parse("{}");

        string disposition = PilotProofPacketCommercialReadinessBuilder.ResolveProofDisposition(
            document.RootElement,
            demoWarning: false,
            pilotStrictSatisfied: true,
            roiBasisStatus: "classified",
            deferredScopePresent: false,
            dataConsistencyDisposition: "PASS",
            roiFreshnessDisposition: "PASS",
            explanationConfidenceDisposition: "WARN");

        disposition.Should().Be("WARN");
    }

    [Fact]
    public void ParseJson_DeserializesMinimalDocument()
    {
        const string json = """
            {
              "schemaVersion": 2,
              "azure": { "subscriptionId": "sub-1", "tenantId": "tenant-1", "location": "eastus", "environment": "prod" },
              "naming": { "resourcePrefix": "al" },
              "deployment": { "multiRootApplyOptIn": true, "pilotMonthlyBudgetUsd": 500 }
            }
            """;

        ArchlucidStackDocument document = ArchlucidStackDocumentParser.ParseJson(json);

        document.SchemaVersion.Should().Be(2);
        document.Azure.SubscriptionId.Should().Be("sub-1");
        document.Naming.ResourcePrefix.Should().Be("al");
        document.Deployment.MultiRootApplyOptIn.Should().BeTrue();
        document.Deployment.PilotMonthlyBudgetUsd.Should().Be(500);
    }

    [Fact]
    public void ParseJson_NullLiteral_ThrowsInvalidOperationException()
    {
        Action act = () => ArchlucidStackDocumentParser.ParseJson("null");

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ParseYaml_DeserializesCamelCaseKeys()
    {
        const string yaml = """
            schemaVersion: 3
            azure:
              subscriptionId: sub-yaml
              location: westus
            naming:
              resourcePrefix: pfx
            """;

        ArchlucidStackDocument document = ArchlucidStackDocumentParser.ParseYaml(yaml);

        document.SchemaVersion.Should().Be(3);
        document.Azure.SubscriptionId.Should().Be("sub-yaml");
        document.Azure.Location.Should().Be("westus");
        document.Naming.ResourcePrefix.Should().Be("pfx");
    }

    private static string CreateTempDirectory()
    {
        string path = Path.Combine(Path.GetTempPath(), "archlucid-cli-batch15-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);

        return path;
    }

    private static void DeleteTempDirectory(string path)
    {
        try
        {
            if (Directory.Exists(path))
                Directory.Delete(path, recursive: true);
        }
        catch (IOException)
        {
            // Best-effort cleanup for temp probe directory.
        }
    }
}
