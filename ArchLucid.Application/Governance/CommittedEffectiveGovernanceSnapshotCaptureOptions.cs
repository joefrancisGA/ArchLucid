using ArchLucid.Contracts.Governance.PolicyPacks;

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
}
