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
    public Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken) =>
        GetCoreAsync(tenantId, workspaceId, projectId, draftId, expectedUpdatedUtc: null, cancellationToken);

    public Task<DraftRequestResponse?> GetAtAccessRevisionAsync(
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId,
        DateTime expectedUpdatedUtc, CancellationToken cancellationToken) =>
        GetCoreAsync(tenantId, workspaceId, projectId, draftId, expectedUpdatedUtc, cancellationToken);

    public async Task<DraftRequestAccessMetadata?> GetAccessMetadataAsync(
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId, CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        const string sql = """
            SELECT draft.DraftId, draft.TenantId, draft.WorkspaceId, draft.ProjectId,
                draft.ArchitectureId, draft.CreatedByUserId, anchor.PriorRunId, draft.SpawnedRunId, draft.UpdatedUtc
            FROM dbo.DraftRequests AS draft
            OUTER APPLY (
                SELECT CASE
                    WHEN COUNT(*) > 1 OR MAX([type]) NOT IN (0, 1) THEN N'!invalid-run-link'
                    ELSE MAX([value])
                END AS PriorRunId
                FROM OPENJSON(draft.DocumentJson)
                WHERE LOWER([key]) = N'priorrunid'
            ) AS anchor
            WHERE draft.DraftId = @DraftId AND draft.TenantId = @TenantId
                AND draft.WorkspaceId = @WorkspaceId AND draft.ProjectId = @ProjectId;
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<DraftRequestAccessMetadata>(new CommandDefinition(
            sql, new { DraftId = draftId, TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
            cancellationToken: cancellationToken, commandTimeout: InteractiveDraftCommandTimeoutSeconds));
    }

    private async Task<DraftRequestResponse?> GetCoreAsync(
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId,
        DateTime? expectedUpdatedUtc, CancellationToken cancellationToken)
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
                               ArchitectureId,
                               CreatedByUserId,
                               CreatedUtc,
                               UpdatedUtc
                           FROM dbo.DraftRequests
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND (@ExpectedUpdatedUtc IS NULL OR UpdatedUtc = @ExpectedUpdatedUtc);
                           """;

        Stopwatch connectionStopwatch = Stopwatch.StartNew();
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DraftGetHangDiagnostics.Log(
            "sql_get_draft_connection_open",
            ("draftId", draftId),
            ("connectionMs", connectionStopwatch.ElapsedMilliseconds));

        Stopwatch queryStopwatch = Stopwatch.StartNew();
        DynamicParameters parameters = new(new { DraftId = draftId, TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId });
        parameters.Add("ExpectedUpdatedUtc", expectedUpdatedUtc, System.Data.DbType.DateTime2);
        DraftRequestRow? row = await connection.QuerySingleOrDefaultAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                parameters,
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

        if (expectedUpdatedUtc.HasValue)
            return MapRow(row);

        if (TryDeserializeReadModel(row, out DraftRequestResponse? snapshot))
        {
            DraftGetHangDiagnostics.Log("sql_get_draft_using_read_model", ("draftId", draftId));

            if (snapshot is not null && string.IsNullOrWhiteSpace(snapshot.CreatedByUserId))
                snapshot.CreatedByUserId = row.CreatedByUserId;

            if (snapshot is not null && !snapshot.ArchitectureId.HasValue)
                snapshot.ArchitectureId = row.ArchitectureId;

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

        int effectiveMax = DraftRequestRepositoryCore.ClampPriorDraftsMaxCount(maxCount);

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
                             AND Status = N'RunSpawned'
                             AND DraftId <> @ExcludeDraftId
                           ORDER BY UpdatedUtc DESC, DraftId DESC;
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
                    NormalizedSystemName = DraftRequestRepositoryCore.NormalizeSystemName(systemName),
                    DraftingStatus = DraftRequestStatus.Drafting.ToString(),
                    AdmittedStatus = DraftRequestStatus.Admitted.ToString(),
                    ExcludeDraftId = excludeDraftId,
                },
                cancellationToken: cancellationToken));

        return exists == 1;
    }

    /// <inheritdoc />
    public async Task<DraftRequestResponse?> GetBySpawnedRunIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string spawnedRunId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(spawnedRunId);
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        const string sql = """
                           SELECT TOP (1)
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
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
                             AND SpawnedRunId = @SpawnedRunId
                           ORDER BY UpdatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        DraftRequestRow? row = await connection.QuerySingleOrDefaultAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    SpawnedRunId = spawnedRunId,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : MapRow(row);
    }
}
