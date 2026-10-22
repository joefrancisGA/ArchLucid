using ArchLucid.Contracts.Governance;

namespace ArchLucid.Decisioning.Governance.Resolution;

public sealed partial class EffectiveGovernanceResolver
{
    private static List<PolicyPackAssignment> FilterApplicableAssignments(
        IReadOnlyList<PolicyPackAssignment> assignments,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        bool focusedPilotMode = Core.Governance.PolicyPacks.PilotModeGovernanceScope.IsActive;

        return assignments
            .Where(x => AppliesToScope(x, tenantId, workspaceId, projectId))
            .Where(x => focusedPilotMode || x.IsEnabled)
            .ToList();
    }

    /// <summary>
    ///     Determines whether an assignment row applies to the runtime project context, independent of repository SQL details.
    /// </summary>
    /// <remarks>
    ///     Called only from <see cref="ResolveAsync" />. Tenant rows ignore workspace/project columns; workspace rows require
    ///     workspace match;
    ///     project rows require both workspace and project match.
    /// </remarks>
    private static bool AppliesToScope(
        PolicyPackAssignment assignment,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        if (assignment.TenantId != tenantId)
            return false;

        return assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => true,
            GovernanceScopeLevel.Workspace => assignment.WorkspaceId == workspaceId,
            GovernanceScopeLevel.Project => assignment.WorkspaceId == workspaceId && assignment.ProjectId == projectId,
            _ => false
        };
    }
}
