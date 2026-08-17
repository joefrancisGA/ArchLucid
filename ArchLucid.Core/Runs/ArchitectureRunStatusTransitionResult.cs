using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Runs;

/// <summary>Outcome of applying an <see cref="ArchitectureRunStatusLifecycleEvent" /> to a run status.</summary>
public readonly record struct ArchitectureRunStatusTransitionResult(
    bool IsAllowed,
    ArchitectureRunStatus TargetStatus,
    string? DenialReason)
{
    public static ArchitectureRunStatusTransitionResult Allowed(ArchitectureRunStatus targetStatus) =>
        new(true, targetStatus, null);

    public static ArchitectureRunStatusTransitionResult Denied(string reason, ArchitectureRunStatus currentStatus) =>
        new(false, currentStatus, reason);
}
