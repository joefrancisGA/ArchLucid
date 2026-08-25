using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Services;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Filters hypothesis-lane findings from authority rollups, finalize blockers, and coverage metrics.
/// </summary>
public static class AuthorityFindingRollupFilter
{
    public static bool IsExcludedFromAuthorityRollup(Finding finding)
        => AuthorityFindingAuthorityGate.IsExcludedFromAuthoritySnapshotMerge(finding);

    public static List<Finding> ForAuthorityRollup(IReadOnlyList<Finding> findings)
        => AuthorityFindingAuthorityGate.ForAuthoritySnapshotMerge(findings);
}
