using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Optional commit-path inputs so <see cref="IPreCommitGovernanceGate" /> can skip redundant repository reads
///     when the orchestrator already loaded findings and scope assignments (TB-588).
/// </summary>
public sealed class PreCommitGovernancePreloadedData
{
    public IReadOnlyList<Finding>? FindingsSnapshotFindings
    {
        get;
        init;
    }

    public IReadOnlyList<PolicyPackAssignment>? ScopePolicyPackAssignments
    {
        get;
        init;
    }
}
