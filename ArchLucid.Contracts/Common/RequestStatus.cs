namespace ArchLucid.Contracts.Common;

/// <summary>
///     Lifecycle of an architecture request relative to runs. Requests are immutable payloads;
///     this enum drives orchestration and (when persisted) row-level locking semantics.
/// </summary>
public enum RequestStatus
{
    /// <summary>Created or imported; no run has claimed this request yet.</summary>
    Draft = 1,

    /// <summary>At least one run exists in a non-terminal state for this request.</summary>
    Locked = 2,

    /// <summary>All runs for this request are terminal (<see cref="ArchitectureRunStatus.Committed" /> or Failed).</summary>
    Released = 3
}
