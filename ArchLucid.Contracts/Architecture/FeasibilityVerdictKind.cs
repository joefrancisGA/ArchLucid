using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>Three-value feasibility classification (ADR 0050 / R5).</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FeasibilityVerdictKind
{
    /// <summary>Design constraints are satisfiable within stated assumptions.</summary>
    Feasible,

    /// <summary>Economic or empirical infeasibility — default under uncertainty (asymmetry rule).</summary>
    SoftInfeasible,

    /// <summary>Provable contradiction or physical law — citation-gated, confidence fixed at 100.</summary>
    HardInfeasible,
}
