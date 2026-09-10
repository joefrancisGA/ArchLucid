using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class ProseAssumptionHeldCheckAskMapperTests
{
    [Fact]
    public void MapAsks_returns_empty_when_register_is_empty()
    {
        IReadOnlyList<ProseAssumptionHeldCheckAsk> asks = ProseAssumptionHeldCheckAskMapper.MapAsks([], [], 8);

        asks.Should().BeEmpty();
    }

    [Fact]
    public void MapAsks_emits_inventory_zip_ask_for_not_verifiable_public_network_property()
    {
        IReadOnlyList<ProseAssumptionRegisterEntry> register =
        [
            new()
            {
                Statement = "Payment SQL must not be public.",
                DocumentPath = "docs/design.md",
                LineNumber = 12,
                EvidenceRef = "doc:docs/design.md#L12",
                LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                Disposition = ProseAssumptionDisposition.NotVerifiable,
            },
        ];

        IReadOnlyList<HeldCheckLedgerRollupEntry> ledger =
        [
            new()
            {
                InputCode = HeldCheckInputCode.AzureInventoryZip,
                EngineCount = 2,
                EngineTypes = ["declaration-inventory-contradiction", "policy-declaration-inventory-contradiction"],
            },
        ];

        IReadOnlyList<ProseAssumptionHeldCheckAsk> asks =
            ProseAssumptionHeldCheckAskMapper.MapAsks(register, ledger, 8);

        ProseAssumptionHeldCheckAsk ask = asks.Should().ContainSingle().Subject;
        ask.InputCode.Should().Be(HeldCheckInputCode.AzureInventoryZip);
        ask.EvidenceRef.Should().Be("doc:docs/design.md#L12");
    }

    [Fact]
    public void MapAsks_skips_consistent_and_contradicted_rows()
    {
        IReadOnlyList<ProseAssumptionRegisterEntry> register =
        [
            new()
            {
                LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                Disposition = ProseAssumptionDisposition.Consistent,
            },
            new()
            {
                LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                Disposition = ProseAssumptionDisposition.Contradicted,
            },
        ];

        IReadOnlyList<ProseAssumptionHeldCheckAsk> asks = ProseAssumptionHeldCheckAskMapper.MapAsks(
            register,
            [new HeldCheckLedgerRollupEntry { InputCode = HeldCheckInputCode.AzureInventoryZip, EngineCount = 1, EngineTypes = ["x"] }],
            8);

        asks.Should().BeEmpty();
    }
}
