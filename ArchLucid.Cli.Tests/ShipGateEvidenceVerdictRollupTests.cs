using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ShipGateEvidenceVerdictRollupTests
{
    [Fact]
    public void FromGates_WhenAllPass_ReturnsPass()
    {
        IReadOnlyList<ShipGateEvidenceGateResult> gates =
        [
            BuildGate(1, ShipGateEvidenceVerdict.Pass),
            BuildGate(2, ShipGateEvidenceVerdict.Pass),
        ];

        ShipGateEvidenceVerdictRollup.FromGates(gates).Should().Be(ShipGateEvidenceVerdict.Pass);
    }

    [Fact]
    public void FromGates_WhenAnyFail_ReturnsFail()
    {
        IReadOnlyList<ShipGateEvidenceGateResult> gates =
        [
            BuildGate(1, ShipGateEvidenceVerdict.Pass),
            BuildGate(2, ShipGateEvidenceVerdict.Fail),
            BuildGate(3, ShipGateEvidenceVerdict.Unknown),
        ];

        ShipGateEvidenceVerdictRollup.FromGates(gates).Should().Be(ShipGateEvidenceVerdict.Fail);
    }

    [Fact]
    public void FromGates_WhenUnknownWithoutFail_ReturnsUnknown()
    {
        IReadOnlyList<ShipGateEvidenceGateResult> gates =
        [
            BuildGate(1, ShipGateEvidenceVerdict.Pass),
            BuildGate(2, ShipGateEvidenceVerdict.Unknown),
        ];

        ShipGateEvidenceVerdictRollup.FromGates(gates).Should().Be(ShipGateEvidenceVerdict.Unknown);
    }

    private static ShipGateEvidenceGateResult BuildGate(int gateNumber, ShipGateEvidenceVerdict verdict) =>
        new()
        {
            GateNumber = gateNumber,
            Name = $"Gate {gateNumber}",
            Verdict = verdict,
            Evidence = "test",
        };
}
