using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <summary>Resolves optional governance query project ids against the ambient scope.</summary>
public static class GovernanceQueryProjectScope
{
    public static bool TryResolve(Guid? projectId, ScopeContext scope, out Guid resolvedProjectId)
    {
        if (projectId.HasValue && projectId.Value != scope.ProjectId)
        {
            resolvedProjectId = Guid.Empty;

            return false;
        }

        resolvedProjectId = scope.ProjectId;

        return true;
    }
}
