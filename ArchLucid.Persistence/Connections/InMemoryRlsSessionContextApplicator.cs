using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>No-op RLS applicator for in-memory host (no SQL session context).</summary>
public sealed class InMemoryRlsSessionContextApplicator : IRlsSessionContextApplicator
{
    public Task ApplyAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken) =>
        Task.CompletedTask;
}
