using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <summary>Scope binding for risk exception rows (tenant/workspace/project).</summary>
internal static class RiskExceptionScope
{
    public static bool IsVisibleInScope(RiskExceptionRecord? record, ScopeContext scope)
    {
        if (record is null)
            return false;

        return record.TenantId == scope.TenantId
            && record.WorkspaceId == scope.WorkspaceId
            && record.ProjectId == scope.ProjectId;
    }
}
