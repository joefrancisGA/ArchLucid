using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>Scope binding for policy pack assignment rows (tenant/workspace/project).</summary>
internal static class PolicyPackAssignmentScope
{
    public static bool IsVisibleInScope(PolicyPackAssignment? assignment, ScopeContext scope)
    {
        if (assignment is null)
            return false;

        if (assignment.TenantId != scope.TenantId)
            return false;

        string normalizedScopeLevel = GovernanceScopeLevel.TryNormalize(assignment.ScopeLevel)
            ?? GovernanceScopeLevel.Project;

        switch (normalizedScopeLevel)
        {
            case GovernanceScopeLevel.Tenant:
                return true;

            case GovernanceScopeLevel.Workspace:
                return assignment.WorkspaceId == scope.WorkspaceId;

            case GovernanceScopeLevel.Project:
                return assignment.WorkspaceId == scope.WorkspaceId
                    && assignment.ProjectId == scope.ProjectId;

            default:
                return false;
        }
    }
}
