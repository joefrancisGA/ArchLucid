using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Denormalized RLS scope triple stamped onto every relational finding row so row-level security can filter without
///     joining back to the snapshot header.
/// </summary>
internal sealed record FindingRelationalScope(Guid TenantId, Guid WorkspaceId, Guid ProjectId)
{
    public static FindingRelationalScope FromScopeContext(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new FindingRelationalScope(scope.TenantId, scope.WorkspaceId, scope.ProjectId);
    }
}
