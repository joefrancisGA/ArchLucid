using ArchLucid.Contracts.Drafts;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class DapperDraftRequestRepository
{
    /// <inheritdoc />
    public async Task<bool> TrySetArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        const string sql = """
                           UPDATE dbo.DraftRequests
                           SET ArchitectureId = @ArchitectureId,
                               UpdatedUtc = @UpdatedUtc
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND (ArchitectureId IS NULL OR ArchitectureId = @ArchitectureId);

                           SELECT @@ROWCOUNT;
                           """;

        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int rows = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    DraftId = draftId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    ArchitectureId = architectureId,
                    UpdatedUtc = now,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        return rows > 0;
    }
}
