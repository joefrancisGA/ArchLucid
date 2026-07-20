using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <summary>Outcome of a Quick Scan guard check.</summary>
public sealed class QuickScanGuardDecision
{
    public bool Allowed { get; init; }

    public QuickScanGuardRejectionReason? RejectionReason { get; init; }

    public static QuickScanGuardDecision Permit() => new() { Allowed = true };

    public static QuickScanGuardDecision Reject(QuickScanGuardRejectionReason reason) =>
        new() { Allowed = false, RejectionReason = reason };
}
