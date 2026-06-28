namespace ArchLucid.Cli.Commands;

internal static class ShipGateEvidenceVerdictRollup
{
    internal static ShipGateEvidenceVerdict FromGates(IReadOnlyList<ShipGateEvidenceGateResult> gates)
    {
        ArgumentNullException.ThrowIfNull(gates);

        if (gates.Any(static gate => gate.Verdict == ShipGateEvidenceVerdict.Fail))
            return ShipGateEvidenceVerdict.Fail;

        if (gates.Any(static gate => gate.Verdict == ShipGateEvidenceVerdict.Unknown))
            return ShipGateEvidenceVerdict.Unknown;

        return ShipGateEvidenceVerdict.Pass;
    }
}
