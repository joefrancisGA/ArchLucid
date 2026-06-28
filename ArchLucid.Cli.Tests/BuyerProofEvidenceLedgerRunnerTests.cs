using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuyerProofEvidenceLedgerRunnerTests
{
    [Fact]
    public void LoadDirectory_WithSampleProofPack_ParsesMixedArtifacts()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string proofDirectory = Path.Combine(
            repositoryRoot!,
            "fixtures",
            "buyer-proof-evidence",
            "sample-proof-pack");

        BuyerProofEvidenceLedgerContext context = BuyerProofEvidenceLedgerParser.LoadDirectory(proofDirectory);

        context.RunId.Should().Be("aaaaaaaa-1111-1111-1111-111111111111");
        context.RoiBasisStatus.Should().Be("buyer-provided");
        context.RoiSponsorSafe.Should().BeTrue();
        context.DecisionLedgerPresent.Should().BeTrue();
        context.AttributedDecisionChangeCount.Should().Be(1);
        context.PaidPilotLedgerPresent.Should().BeTrue();
        context.ProofPackageCompletenessPresent.Should().BeTrue();
    }

    [Fact]
    public void NormalizeSlots_WithSampleProofPack_MarksRequiredSlotsComplete()
    {
        BuyerProofEvidenceLedgerRules rules = BuyerProofEvidenceLedgerRulesLoader.Load(null);
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string proofDirectory = Path.Combine(
            repositoryRoot!,
            "fixtures",
            "buyer-proof-evidence",
            "sample-proof-pack");

        BuyerProofEvidenceLedgerContext context = BuyerProofEvidenceLedgerParser.LoadDirectory(proofDirectory);
        IReadOnlyList<BuyerProofEvidenceLedgerSlotStatus> slots =
            BuyerProofEvidenceLedgerNormalizer.NormalizeSlots(context, rules);

        slots.Should().Contain(slot =>
            slot.SlotId == "committed-run"
            && slot.Verdict == BuyerProofEvidenceLedgerVerdict.Pass);

        slots.Should().Contain(slot =>
            slot.SlotId == "roi-basis-labeled"
            && slot.Verdict == BuyerProofEvidenceLedgerVerdict.Pass);

        slots.Where(static slot => slot.RequiredForSponsorSend)
            .Should()
            .OnlyContain(slot => slot.Verdict != BuyerProofEvidenceLedgerVerdict.Fail);
    }

    [Fact]
    public void Run_WithDefaultFixtures_PassesNormalization()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        BuyerProofEvidenceLedgerRules rules = BuyerProofEvidenceLedgerRulesLoader.Load(null);
        BuyerProofEvidenceLedgerRunner runner = new();
        BuyerProofEvidenceLedgerReport report = runner.Run(
            repositoryRoot!,
            new BuyerProofEvidenceLedgerOptions(),
            rules);

        report.OverallVerdict.Should().BeOneOf(
            BuyerProofEvidenceLedgerVerdict.Pass,
            BuyerProofEvidenceLedgerVerdict.Warn);
        report.NormalizedSlots.Should().HaveCount(rules.CanonicalSlots.Count);
        report.Checks.Should().Contain(check =>
            check.Name == "Buyer-proof fixture pack"
            && check.Verdict == BuyerProofEvidenceLedgerVerdict.Pass);
    }

    [Fact]
    public void Run_WithIncompleteProofPack_ReturnsFailVerdict()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string tempProof = Path.Combine(Path.GetTempPath(), $"archlucid-buyer-proof-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempProof);

        try
        {
            File.WriteAllText(
                Path.Combine(tempProof, "go-no-go-summary.json"),
                """
                {
                  "runId": "bbbbbbbb-2222-2222-2222-222222222222",
                  "roiBasisStatus": "not-collected",
                  "roiSponsorSafe": false,
                  "sponsorPacketDisposition": "HOLD",
                  "procurementDisposition": "HOLD"
                }
                """);

            BuyerProofEvidenceLedgerRules rules = BuyerProofEvidenceLedgerRulesLoader.Load(null);
            BuyerProofEvidenceLedgerRunner runner = new();
            BuyerProofEvidenceLedgerReport report = runner.Run(
                repositoryRoot!,
                new BuyerProofEvidenceLedgerOptions { ProofDirectory = tempProof },
                rules);

            report.OverallVerdict.Should().Be(BuyerProofEvidenceLedgerVerdict.Fail);
            report.NormalizedSlots.Should().Contain(slot =>
                slot.SlotId == "roi-basis-labeled"
                && slot.Verdict == BuyerProofEvidenceLedgerVerdict.Fail);
        }
        finally
        {
            if (Directory.Exists(tempProof))
                Directory.Delete(tempProof, recursive: true);
        }
    }
}
