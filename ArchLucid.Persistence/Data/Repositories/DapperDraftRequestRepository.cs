using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="IDraftRequestRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via DbUp integration tests.")]
public sealed class DapperDraftRequestRepository(ISqlConnectionFactory connectionFactory) : IDraftRequestRepository
{
    private static readonly JsonSerializerOptions JsonOptions = ContractJson.CamelCaseIgnoreNullCompact;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        const string sql = """
                           SELECT
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
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        DraftRequestRow? row = await connection.QuerySingleOrDefaultAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                new { DraftId = draftId, TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapRow(row);
    }

    /// <inheritdoc />
    public async Task<DraftRequestResponse> CreateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string createdByUserId,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        Guid draftId = Guid.NewGuid();
        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        string documentJson = JsonSerializer.Serialize(document, JsonOptions);

        const string sql = """
                           INSERT INTO dbo.DraftRequests (
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               CreatedByUserId,
                               Status,
                               DocumentJson,
                               CreatedUtc,
                               UpdatedUtc)
                           VALUES (
                               @DraftId,
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId,
                               @CreatedByUserId,
                               @Status,
                               @DocumentJson,
                               @CreatedUtc,
                               @UpdatedUtc);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    DraftId = draftId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    CreatedByUserId = createdByUserId,
                    Status = DraftRequestStatus.Drafting.ToString(),
                    DocumentJson = documentJson,
                    CreatedUtc = now,
                    UpdatedUtc = now,
                },
                cancellationToken: cancellationToken));

        return new DraftRequestResponse
        {
            DraftId = draftId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Status = DraftRequestStatus.Drafting,
            Document = document,
            CreatedUtc = now,
            UpdatedUtc = now,
        };
    }

    /// <inheritdoc />
    public async Task<DraftRequestResponse?> UpdateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? redirectReason,
        string? spawnedRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        string documentJson = JsonSerializer.Serialize(document, JsonOptions);

        const string sql = """
                           UPDATE dbo.DraftRequests
                           SET
                               Status = @Status,
                               DocumentJson = @DocumentJson,
                               RedirectReason = @RedirectReason,
                               SpawnedRunId = @SpawnedRunId,
                               UpdatedUtc = @UpdatedUtc
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;

                           SELECT @@ROWCOUNT;
                           """;

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
                    Status = status.ToString(),
                    DocumentJson = documentJson,
                    RedirectReason = redirectReason,
                    SpawnedRunId = spawnedRunId,
                    UpdatedUtc = now,
                },
                cancellationToken: cancellationToken));

        if (rows == 0)
            return null;

        DraftRequestResponse? refreshed = await GetAsync(tenantId, workspaceId, projectId, draftId, cancellationToken);

        return refreshed;
    }

    /// <inheritdoc />
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Cross-tenant draft intake reaper hard-deletes terminal Redirected/Abandoned rows by UpdatedUtc cutoff.")]
    public async Task<DraftIntakeReaperBatchResult> HardDeleteTerminalDraftsBatchAsync(
        DateTimeOffset updatedBeforeUtc,
        int batchSize,
        CancellationToken cancellationToken)
    {
        int effectiveBatchSize = Math.Clamp(batchSize, 1, 10_000);
        DateTime cutoff = updatedBeforeUtc.UtcDateTime;

        const string sql = """
                           DELETE TOP (@BatchSize) dr
                           OUTPUT DELETED.DraftId
                           FROM dbo.DraftRequests dr
                           WHERE dr.Status IN (N'Redirected', N'Abandoned')
                             AND dr.UpdatedUtc < @UpdatedBeforeUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<Guid> deleted = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new { BatchSize = effectiveBatchSize, UpdatedBeforeUtc = cutoff },
                cancellationToken: cancellationToken));

        List<Guid> deletedDraftIds = deleted.ToList();

        return new DraftIntakeReaperBatchResult { DeletedDraftIds = deletedDraftIds };
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

    private static DraftRequestResponse MapRow(DraftRequestRow row)
    {
        DraftRequestDocument? document =
            JsonSerializer.Deserialize<DraftRequestDocument>(row.DocumentJson, JsonOptions);

        if (document is null)
            throw new InvalidOperationException($"Draft '{row.DraftId}' has invalid DocumentJson.");

        if (!Enum.TryParse(row.Status, ignoreCase: true, out DraftRequestStatus status))
            throw new InvalidOperationException($"Draft '{row.DraftId}' has unknown status '{row.Status}'.");

        return new DraftRequestResponse
        {
            DraftId = row.DraftId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            Status = status,
            Document = document,
            RedirectReason = row.RedirectReason,
            SpawnedRunId = row.SpawnedRunId,
            // SQL datetime2 has no Kind; leave Unspecified and System.Text.Json omits Z, so browsers
            // treat UTC wall-clock as local and relative labels jump into the future by the offset.
            CreatedUtc = DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc),
            UpdatedUtc = DateTime.SpecifyKind(row.UpdatedUtc, DateTimeKind.Utc),
        };
    }

    private sealed class DraftRequestRow
    {
        public Guid DraftId
        {
            get;
            set;
        }

        public Guid TenantId
        {
            get;
            set;
        }

        public Guid WorkspaceId
        {
            get;
            set;
        }

        public Guid ProjectId
        {
            get;
            set;
        }

        public string Status
        {
            get;
            set;
        } = string.Empty;

        public string DocumentJson
        {
            get;
            set;
        } = string.Empty;

        public string? RedirectReason
        {
            get;
            set;
        }

        public string? SpawnedRunId
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public DateTime UpdatedUtc
        {
            get;
            set;
        }
    }
}
