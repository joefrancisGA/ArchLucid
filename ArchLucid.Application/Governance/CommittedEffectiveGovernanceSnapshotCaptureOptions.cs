using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Optional inputs for <see cref="ICommittedEffectiveGovernanceSnapshotCapturer" /> to avoid duplicate scope reads.
/// </summary>
public sealed class CommittedEffectiveGovernanceSnapshotCaptureOptions
{
    public IReadOnlyList<PolicyPackAssignment>? PreloadedScopePolicyPackAssignments
    {
        get;
        init;
    }

    /// <summary>Architecture request captured at execute time for commit-time coverage parity.</summary>
    public ArchitectureRequest? PreloadedArchitectureRequest
    {
        get;
        init;
    }

    /// <summary>Wave-11 suggestion 109: focused pilot mode from create-time run header pins.</summary>
    public bool? PinnedFocusedPilotModeEnabled
    {
        get;
        init;
    }

    /// <summary>Wave-11 suggestion 109: focused pilot cloud provider from create-time run header pins.</summary>
    public int? PinnedFocusedPilotCloudProvider
    {
        get;
        init;
    }
}
