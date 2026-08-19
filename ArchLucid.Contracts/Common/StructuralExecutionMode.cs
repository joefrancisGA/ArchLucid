namespace ArchLucid.Contracts.Common;

/// <summary>
///     How agent outputs for a run were produced at a structural level (INV-002); persisted on <c>dbo.Runs</c> and
///     exposed on <see cref="Metadata.ArchitectureRun" />.
/// </summary>
public enum StructuralExecutionMode
{
    /// <summary>Deterministic / simulator execution path.</summary>
    Simulator = 0,

    /// <summary>Live model path without recorded simulator substitution for the run.</summary>
    Real = 1,

    /// <summary>Real path was attempted but the run recorded simulator substitution (pilot fallback).</summary>
    Fallback = 2,

    /// <summary>Mixed or partially substituted outputs (reserved; not defaulted automatically).</summary>
    Mixed = 3
}
