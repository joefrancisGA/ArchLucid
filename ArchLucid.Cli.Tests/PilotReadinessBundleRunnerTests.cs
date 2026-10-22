using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotReadinessBundleRunnerTests
{
    [Fact]
    public async Task RunAsync_OfflineMode_OrchestratesEightSlotsAndSkipsShipGateWithoutRunId()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        PilotReadinessBundleRunner runner = new();
        PilotReadinessBundleOptions options = new()
        {
            SuppressDefaultArtifacts = true,
        };

        PilotReadinessBundleReport report = await runner.RunAsync(
            repositoryRoot!,
            options,
            httpClient: null,
            config: null,
            rawArgs: [],
            CancellationToken.None);

        report.Slots.Should().HaveCount(8);
        report.Slots.Should().Contain(slot =>
            slot.SlotKey == PilotReadinessBundleSlots.ShipGateEvidence
            && slot.Verdict == PilotReadinessBundleSlotVerdict.Skipped);
        report.Slots.Should().Contain(slot => slot.SlotKey == PilotReadinessBundleSlots.BuyerProofEvidenceLedger);
        report.Slots.Should().Contain(slot => slot.SlotKey == PilotReadinessBundleSlots.CitationIntegrity);
        report.Slots.Should().Contain(slot => slot.SlotKey == PilotReadinessBundleSlots.TenantIsolationNegativeTest);
        report.Slots.Should().Contain(slot => slot.SlotKey == PilotReadinessBundleSlots.ItsmPullForwardGate);
        report.OverallVerdict.Should().NotBe(PilotReadinessBundleVerdict.Fail);
    }
}
