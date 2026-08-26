using System.Diagnostics;

using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class DapperDraftRequestRepository
{
    /// <inheritdoc />
    public async Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        DraftGetHangDiagnostics.Log(
            "sql_get_draft_started",
            ("draftId", draftId),
            ("tenantId", tenantId));

        const string sql = """
                           SELECT
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               Status,
                               DocumentJson,
                               ReadModelJson,
                               ReadModelSchemaVersion,
                               RedirectReason,
                               SpawnedRunId,
                               CreatedUtc,
                               UpdatedUtc
                           FROM dbo.DraftRequests
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        Stopwatch connectionStopwatch = Stopwatch.StartNew();
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DraftGetHangDiagnostics.Log(
            "sql_get_draft_connection_open",
            ("draftId", draftId),
            ("connectionMs", connectionStopwatch.ElapsedMilliseconds));

        Stopwatch queryStopwatch = Stopwatch.StartNew();
        DraftRequestRow? row = await connection.QuerySingleOrDefaultAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                new { DraftId = draftId, TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        DraftGetHangDiagnostics.Log(
            "sql_get_draft_query_completed",
            ("draftId", draftId),
            ("queryMs", queryStopwatch.ElapsedMilliseconds),
            ("rowFound", row is not null),
            ("readModelPresent", row is not null && !string.IsNullOrWhiteSpace(row.ReadModelJson)));

        if (row is null)
            return null;

        if (TryDeserializeReadModel(row, out DraftRequestResponse? snapshot))
        {
            DraftGetHangDiagnostics.Log("sql_get_draft_using_read_model", ("draftId", draftId));
            return snapshot;
        }

        DraftGetHangDiagnostics.Log("sql_get_draft_mapping_document", ("draftId", draftId));
        DraftRequestResponse mapped = MapRow(row);
        await TryHealReadModelAsync(connection, draftId, tenantId, workspaceId, projectId, mapped, cancellationToken);

        DraftGetHangDiagnostics.Log("sql_get_draft_heal_completed", ("draftId", draftId));
        return mapped;
    }

    /// <inheritdoc />
    public async Task<int> CountChildBranchesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid parentDraftId,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.DraftRequests
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND JSON_VALUE(DocumentJson, '$.parentDraftId') = @ParentDraftId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int count = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    ParentDraftId = parentDraftId.ToString("D"),
                },
                cancellationToken: cancellationToken));

        return count;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<DraftRequestResponse>> ListRunSpawnedInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid excludeDraftId,
        int maxCount,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        int effectiveMax = Math.Clamp(maxCount, 1, 25);

        const string sql = """
                           SELECT TOP (@MaxCount)
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               Status,
                               DocumentJson,
                               RedirectReason,
                               SpawnedRunId,
                               CreatedUtc,
                               UpdatedUtc
                           FROM dbo.DraftRequests
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND Status = N'RunSpawned'
                             AND DraftId <> @ExcludeDraftId
                           ORDER BY UpdatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<DraftRequestRow> rows = await connection.QueryAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    ExcludeDraftId = excludeDraftId,
                    MaxCount = effectiveMax,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapRow).ToList();
    }

    /// <inheritdoc />
    public async Task<bool> ExistsMutableDraftWithSystemNameInWorkspaceAsync(
        Guid tenantId,
        Guid workspaceId,
        string systemName,
        Guid? excludeDraftId,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        if (string.IsNullOrWhiteSpace(systemName))
            throw new ArgumentException("System name is required.", nameof(systemName));

        const string sql = """
                           SELECT CASE
                               WHEN EXISTS (
                                   SELECT 1
                                   FROM dbo.DraftRequests
                                   WHERE TenantId = @TenantId
                                     AND WorkspaceId = @WorkspaceId
                                     AND Status IN (@DraftingStatus, @AdmittedStatus)
                                     AND UPPER(LTRIM(RTRIM(JSON_VALUE(DocumentJson, '$.systemName')))) = @NormalizedSystemName
                                     AND (@ExcludeDraftId IS NULL OR DraftId <> @ExcludeDraftId)
                               ) THEN 1
                               ELSE 0
                           END;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int exists = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    NormalizedSystemName = systemName.Trim().ToUpperInvariant(),
                    DraftingStatus = DraftRequestStatus.Drafting.ToString(),
                    AdmittedStatus = DraftRequestStatus.Admitted.ToString(),
                    ExcludeDraftId = excludeDraftId,
                },
                cancellationToken: cancellationToken));

        return exists == 1;
    }
}
