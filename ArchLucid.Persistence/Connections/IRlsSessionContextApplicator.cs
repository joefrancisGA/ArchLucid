using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Applies tenant/workspace/project <c>SESSION_CONTEXT</c> before tenant-scoped SQL (defense-in-depth when RLS is on).
/// </summary>
public interface IRlsSessionContextApplicator
{
    Task ApplyAsync(SqlConnection connection, Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken cancellationToken);
}
