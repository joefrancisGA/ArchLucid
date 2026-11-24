using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class HeldCheckLedgerTests
{
    [Fact]
    public void BuildRollup_ranks_by_engine_count_then_input_code()
    {
        HeldCheckLedger ledger = new();

        ledger.Record("secrets-lifecycle", HeldCheckInputCode.AzureInventoryZip);
        ledger.Record("orphaned-azure-resource", HeldCheckInputCode.AzureInventoryZip);
        ledger.Record("identity-blast-radius", HeldCheckInputCode.ActorNodes);
        ledger.Record("external-exposure", HeldCheckInputCode.ActorNodes);
        ledger.Record("trust-boundary", HeldCheckInputCode.ActorNodes);

        IReadOnlyList<HeldCheckLedgerRollupEntry> rollup = ledger.BuildRollup();

        rollup.Should().HaveCount(2);
        rollup[0].InputCode.Should().Be(HeldCheckInputCode.ActorNodes);
        rollup[0].EngineCount.Should().Be(3);
        rollup[1].InputCode.Should().Be(HeldCheckInputCode.AzureInventoryZip);
        rollup[1].EngineCount.Should().Be(2);
    }

    [Fact]
    public void TryRecord_no_ops_when_ledger_is_null()
    {
        Action act = () => HeldCheckLedger.TryRecord(null, "secrets-lifecycle", HeldCheckInputCode.AzureInventoryZip);

        act.Should().NotThrow();
    }

    [Fact]
    public void BuildRollup_retains_all_concurrent_engine_records()
    {
        HeldCheckLedger ledger = new();

        Parallel.For(0, 512, index =>
        {
            ledger.Record($"engine-{index}", HeldCheckInputCode.ActorNodes);
            ledger.Record($"engine-{index}", HeldCheckInputCode.ActorNodes);
        });

        HeldCheckLedgerRollupEntry entry = ledger.BuildRollup().Should().ContainSingle().Which;
        entry.EngineCount.Should().Be(512);
        entry.EngineTypes.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void BuildRollup_can_snapshot_while_engines_record()
    {
        HeldCheckLedger ledger = new();

        Parallel.Invoke(
            () => Parallel.For(0, 512, index =>
                ledger.Record($"engine-{index}", HeldCheckInputCode.AzureInventoryZip)),
            () =>
            {
                for (int i = 0; i < 100; i++)
                {
                    foreach (HeldCheckLedgerRollupEntry entry in ledger.BuildRollup())
                        entry.EngineCount.Should().Be(entry.EngineTypes.Count);
                }
            });

        ledger.BuildRollup().Should().ContainSingle().Which.EngineCount.Should().Be(512);
    }
}
