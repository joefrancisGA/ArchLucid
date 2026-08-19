using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Tenant triple checks for Cosmos graph snapshot documents (TB-073 remainder).
/// </summary>
internal static class CosmosGraphSnapshotScopeFilter
{
    internal static bool DocumentMatchesScope(ScopeContext scope, GraphSnapshotDocument document)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(document);

        if (scope.TenantId == Guid.Empty)
            return true;

        if (!Guid.TryParse(document.TenantId, out Guid docTenant)
            || !Guid.TryParse(document.WorkspaceId, out Guid docWorkspace)
            || !Guid.TryParse(document.ProjectId, out Guid docProject))
        {
            return false;
        }

        return docTenant == scope.TenantId
               && docWorkspace == scope.WorkspaceId
               && docProject == scope.ProjectId;
    }
}
