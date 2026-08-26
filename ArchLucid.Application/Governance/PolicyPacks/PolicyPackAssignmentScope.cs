using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>Scope binding for policy pack assignment rows (tenant/workspace/project).</summary>
internal static class PolicyPackAssignmentScope
{
    public static bool IsVisibleInScope(PolicyPackAssignment? assignment, ScopeContext scope)
    {
        if (assignment is null)
            return false;

        return assignment.TenantId == scope.TenantId
            && assignment.WorkspaceId == scope.WorkspaceId
            && assignment.ProjectId == scope.ProjectId;
    }
}
