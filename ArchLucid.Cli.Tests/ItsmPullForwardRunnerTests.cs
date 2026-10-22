using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ItsmPullForwardRunnerTests
{
    [Fact]
    public void Run_WithFixturesAndNoEvidence_DefaultsToHold()
    {
        using TempRepoFixture repo = TempRepoFixture.CreateWithFixtures();

        ItsmPullForwardRunner runner = new();
        ItsmPullForwardReport report = runner.Run(repo.Root, new ItsmPullForwardOptions());

        report.Recommendation.Should().Be(ItsmPullForwardVerdict.Hold);
        report.Triggers.ActivatedTriggerCount.Should().Be(0);
    }

    [Fact]
    public void Run_WithTwoTriggers_RecommendsPullForward()
    {
        using TempRepoFixture repo = TempRepoFixture.CreateWithFixtures(includeEvidence: true, sowContingent: 1, manualHandoff: 1);

        ItsmPullForwardRunner runner = new();
        ItsmPullForwardReport report = runner.Run(repo.Root, new ItsmPullForwardOptions { EvidencePath = repo.EvidencePath });

        report.Recommendation.Should().Be(ItsmPullForwardVerdict.PullForward);
        report.RequiresOwnerAction.Should().BeTrue();
    }

    [Fact]
    public void AggregateTriggers_CountsConnectorGapFromPaidPilotLedger()
    {
        using TempRepoFixture repo = TempRepoFixture.CreateWithFixtures(includeLedger: true);

        ItsmPullForwardTriggerCounts triggers = ItsmPullForwardEvidenceParser.AggregateTriggers(
            repo.Root,
            new ItsmPullForwardOptions { LedgerDirectory = repo.LedgerDirectory });

        triggers.ConnectorPrimaryBlockerPilotCount.Should().Be(1);
        triggers.ActivatedTriggerCount.Should().Be(1);
    }

    private sealed class TempRepoFixture : IDisposable
    {
        public string Root { get; }

        public string EvidencePath { get; }

        public string LedgerDirectory { get; }

        private TempRepoFixture(string root, string evidencePath, string ledgerDirectory)
        {
            Root = root;
            EvidencePath = evidencePath;
            LedgerDirectory = ledgerDirectory;
        }

        public static TempRepoFixture CreateWithFixtures(
            bool includeEvidence = false,
            bool includeLedger = false,
            int sowContingent = 0,
            int manualHandoff = 0)
        {
            string root = Path.Combine(Path.GetTempPath(), "archlucid-itsm-gate-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);

            WriteFile(root, Path.Combine("docs", "go-to-market", "AZURE_MARKETPLACE_SAAS_OFFER.md"), "# marker");
            WriteFile(root, Path.Combine("docs", "go-to-market", "GTM_BACKLOG.md"), "# Closed hold decisions (owner)");
            WriteFile(
                root,
                Path.Combine("docs", "go-to-market", "validation", "templates", "paid-pilot-evidence-ledger.template.json"),
                "{}");
            WriteFile(
                root,
                Path.Combine("fixtures", "itsm", "connector-pull-forward-evidence.template.json"),
                "{}");
            WriteFile(
                root,
                Path.Combine("ArchLucid.Api", "Controllers", "Integrations", "ItsmOutboundIssuesController.cs"),
                "// seam");
            WriteFile(
                root,
                Path.Combine("ArchLucid.Api", "Controllers", "Integrations", "ItsmIntegrationHealthController.cs"),
                "// seam");
            WriteFile(
                root,
                Path.Combine(
                    "ArchLucid.Core",
                    "Persistence",
                    "ApplicationPorts",
                    "Integrations",
                    "IItsmFindingCorrelationRepository.cs"),
                "// seam");

            string evidencePath = Path.Combine(root, "artifacts", "itsm", "connector-pull-forward-evidence.json");
            string ledgerDirectory = Path.Combine(root, "artifacts", "validation", "paid-pilot-ledgers");

            if (includeEvidence)
            {
                object payload = new
                {
                    schema = "archlucid.connector-pull-forward-evidence.v1",
                    signals = new
                    {
                        connectorPrimaryBlockerPilotCount = 0,
                        sowContingentOnConnectorCount = sowContingent,
                        manualHandoffDominatesSecondReviewCount = manualHandoff,
                    },
                };

                WriteFile(root, evidencePath, JsonSerializer.Serialize(payload));
            }

            if (includeLedger)
            {
                object ledger = new
                {
                    schema = "archlucid.paid-pilot-evidence-ledger.v1",
                    paidPilot = true,
                    blockers = new[]
                    {
                        new { category = "connector-gap", description = "Buyer needed Jira sync", deferralScope = "v1.1" },
                    },
                };

                WriteFile(root, Path.Combine(ledgerDirectory, "pilot-a.json"), JsonSerializer.Serialize(ledger));
            }

            return new TempRepoFixture(root, evidencePath, ledgerDirectory);
        }

        private static void WriteFile(string root, string relativePath, string contents)
        {
            string absolutePath = Path.Combine(root, relativePath);
            string? directory = Path.GetDirectoryName(absolutePath);

            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            File.WriteAllText(absolutePath, contents);
        }

        public void Dispose()
        {
            if (Directory.Exists(Root))
                Directory.Delete(Root, recursive: true);
        }
    }
}
