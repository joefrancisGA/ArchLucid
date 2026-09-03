using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;

namespace ArchLucid.Decisioning.Governance.Resolution;

public sealed partial class EffectiveGovernanceResolver
{
    private static EffectiveGovernanceResolutionResult BuildResolutionResult(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        List<EffectiveGovernanceFacetMerger.ResolvedPackRow> resolvedPacks,
        List<string> skippedNotes)
    {
        EffectiveGovernanceResolutionResult result = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        foreach (string note in skippedNotes)
            result.Notes.Add(note);

        EffectiveGovernanceFacetMerger.Merge(result, resolvedPacks);

        return result;
    }

    /// <summary>
    ///     Computes a single sortable rank: base tier (tenant 1000, workspace 2000, project 3000) plus 100 when
    ///     <see cref="PolicyPackAssignment.IsPinned" />.
    /// </summary>
    /// <remarks>
    ///     <strong>Why tier &gt; pin:</strong> an unpinned project assignment (3000) still beats a pinned tenant assignment
    ///     (1100), so scope always wins over pin.
    ///     Exposed as <c>internal</c> for unit tests. Used by <see cref="EffectiveGovernanceFacetMerger" />.
    /// </remarks>
    internal static int GetPrecedenceRank(PolicyPackAssignment assignment)
    {
        int tier = assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => GovernanceConstants.PrecedenceTiers.Tenant,
            GovernanceScopeLevel.Workspace => GovernanceConstants.PrecedenceTiers.Workspace,
            GovernanceScopeLevel.Project => GovernanceConstants.PrecedenceTiers.Project,
            _ => 0
        };

        return assignment.IsPinned ? tier + GovernanceConstants.PrecedenceTiers.PinnedBoost : tier;
    }
}
