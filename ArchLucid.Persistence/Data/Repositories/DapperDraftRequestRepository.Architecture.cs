using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class DapperDraftRequestRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<DraftRequestResponse>> ListByArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        const string sql = """
                           SELECT
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               ArchitectureId,
                               Status,
                               DocumentJson,
                               ReadModelJson,
                               ReadModelSchemaVersion,
                               RedirectReason,
                               SpawnedRunId,
                               SpawnedArchitectureVersionId,
                               DocumentContentHashSha256,
                               SpawnedDocumentContentHashSha256,
                               CreatedByUserId,
                               CreatedUtc,
                               UpdatedUtc
                           FROM dbo.DraftRequests
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                           ORDER BY UpdatedUtc DESC, DraftId DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<DraftRequestRow> rows = await connection.QueryAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        return rows.Select(MapRow).ToList();
    }

    /// <inheritdoc />
    public async Task<int> CountByArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.DraftRequests
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));
    }

    /// <inheritdoc />
    public async Task<bool> SetArchitectureIdAsync(
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
                               ReadModelJson = NULL,
                               ReadModelSchemaVersion = 0,
                               UpdatedUtc = @UpdatedUtc
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           SELECT @@ROWCOUNT;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    DraftId = draftId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    ArchitectureId = architectureId,
                    UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        if (affected == 0)
            return false;

        DraftRequestResponse? mapped = await GetAsync(tenantId, workspaceId, projectId, draftId, cancellationToken);

        if (mapped is not null)
        {
            await TryHealReadModelAsync(
                connection,
                draftId,
                tenantId,
                workspaceId,
                projectId,
                mapped,
                cancellationToken);
        }

        return true;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<DraftRequestResponse>> ListWithNullArchitectureIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken cancellationToken)
    {
        if (take <= 0)
            return [];

        const string sql = """
                           SELECT TOP (@Take)
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               ArchitectureId,
                               Status,
                               DocumentJson,
                               RedirectReason,
                               SpawnedRunId,
                               SpawnedArchitectureVersionId,
                               DocumentContentHashSha256,
                               SpawnedDocumentContentHashSha256,
                               CreatedByUserId,
                               CreatedUtc,
                               UpdatedUtc
                           FROM dbo.DraftRequests
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND ArchitectureId IS NULL
                           ORDER BY CreatedUtc ASC, DraftId ASC;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        IEnumerable<DraftRequestRow> rows = await connection.QueryAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Take = take,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        return rows.Select(MapRow).ToList();
    }
}
