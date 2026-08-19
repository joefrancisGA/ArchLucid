using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>Kind of authority backing a <see cref="FeasibilityVerdictKind.HardInfeasible" /> verdict (ADR 0050).</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FeasibilityCitationKind
{
    /// <summary>A named physical or mathematical law (e.g. speed-of-light RTT, CAP).</summary>
    NamedLaw,

    /// <summary>A named theorem or impossibility result.</summary>
    NamedTheorem,

    /// <summary>A demonstrably contradictory pair from the <c>INV-*</c> catalog (unsat core).</summary>
    InvariantContradiction,
}
