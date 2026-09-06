using System.Data;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed class SqlArchitectureIdentityRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureIdentityRepository
{
    private const int MaxListTake = 200;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<ArchitectureIdentityRecord> CreateAsync(
        ScopeContext scope,
        ArchitectureIdentityCreateArgs createArgs,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(createArgs);

        string displayName = NormalizeRequiredDisplayName(createArgs.DisplayName);
        string? description = NormalizeOptionalDescription(createArgs.Description);

        Guid architectureId = Guid.NewGuid();
        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        const string sql = """
                           INSERT INTO dbo.Architectures
                           (
                               ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                               DisplayName, Description, CurrentModelId, CreatedUtc, UpdatedUtc
                           )
                           VALUES
                           (
                               @ArchitectureId, @TenantId, @WorkspaceId, @ScopeProjectId,
                               @DisplayName, @Description, @CurrentModelId, @CreatedUtc, @UpdatedUtc
                           );
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    DisplayName = displayName,
                    Description = description,
                    CurrentModelId = createArgs.CurrentModelId,
                    CreatedUtc = nowUtc,
                    UpdatedUtc = nowUtc,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return new ArchitectureIdentityRecord
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            DisplayName = displayName,
            Description = description,
            CurrentModelId = createArgs.CurrentModelId,
            CreatedUtc = nowUtc,
            UpdatedUtc = nowUtc,
        };
    }

    public async Task<ArchitectureIdentityRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                                  DisplayName, Description, CurrentModelId, LatestSealedManifestId,
                                  CreatedUtc, UpdatedUtc
                           FROM dbo.Architectures
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureIdentityRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<ArchitectureIdentityListResult> ListAsync(
        ScopeContext scope,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        int effectiveSkip = Math.Max(0, skip);
        int effectiveTake = Math.Clamp(take, 1, MaxListTake);

        const string countSql = """
                                SELECT COUNT(1)
                                FROM dbo.Architectures
                                WHERE TenantId = @TenantId
                                  AND WorkspaceId = @WorkspaceId
                                  AND ScopeProjectId = @ScopeProjectId;
                                """;

        const string listSql = """
                               SELECT
                                   a.ArchitectureId,
                                   a.DisplayName,
                                   a.Description,
                                   a.UpdatedUtc,
                                   a.LatestSealedManifestId,
                                   draftCounts.DraftCount,
                                   reviewCounts.ReviewCount,
                                   currentDraft.DraftId AS CurrentOpenDraftId,
                                   currentDraft.SystemName AS CurrentOpenDraftSystemName,
                                   currentDraft.UpdatedUtc AS CurrentOpenDraftUpdatedUtc,
                                   currentDraft.SpawnLocked AS CurrentOpenDraftSpawnLocked,
                                   latestReview.ReviewRunId AS LatestReviewRunId,
                                   latestReview.UpdatedUtc AS LatestReviewUpdatedUtc
                               FROM dbo.Architectures a
                               OUTER APPLY (
                                   SELECT COUNT(1) AS DraftCount
                                   FROM dbo.DraftRequests d
                                   WHERE d.ArchitectureId = a.ArchitectureId
                                     AND d.TenantId = a.TenantId
                                     AND d.WorkspaceId = a.WorkspaceId
                                     AND d.ProjectId = a.ScopeProjectId
                               ) draftCounts
                               OUTER APPLY (
                                   SELECT COUNT(1) AS ReviewCount
                                   FROM dbo.Reviews r
                                   WHERE r.ArchitectureId = a.ArchitectureId
                                     AND r.TenantId = a.TenantId
                                     AND r.WorkspaceId = a.WorkspaceId
                                     AND r.ScopeProjectId = a.ScopeProjectId
                               ) reviewCounts
                               OUTER APPLY (
                                   SELECT TOP (1)
                                       d.DraftId,
                                       COALESCE(NULLIF(LTRIM(RTRIM(JSON_VALUE(d.DocumentJson, '$.systemName'))), N''), a.DisplayName) AS SystemName,
                                       d.UpdatedUtc,
                                       CASE
                                           WHEN d.Status = N'RunSpawned' OR d.SpawnedRunId IS NOT NULL THEN 1
                                           ELSE 0
                                       END AS SpawnLocked
                                   FROM dbo.DraftRequests d
                                   WHERE d.ArchitectureId = a.ArchitectureId
                                     AND d.TenantId = a.TenantId
                                     AND d.WorkspaceId = a.WorkspaceId
                                     AND d.ProjectId = a.ScopeProjectId
                                     AND d.Status <> N'RunSpawned'
                                     AND d.SpawnedRunId IS NULL
                                   ORDER BY d.UpdatedUtc DESC
                               ) currentDraft
                               OUTER APPLY (
                                   SELECT TOP (1)
                                       r.RunId AS ReviewRunId,
                                       r.CreatedUtc AS UpdatedUtc
                                   FROM dbo.Reviews r
                                   WHERE r.ArchitectureId = a.ArchitectureId
                                     AND r.TenantId = a.TenantId
                                     AND r.WorkspaceId = a.WorkspaceId
                                     AND r.ScopeProjectId = a.ScopeProjectId
                                   ORDER BY r.CreatedUtc DESC
                               ) latestReview
                               WHERE a.TenantId = @TenantId
                                 AND a.WorkspaceId = @WorkspaceId
                                 AND a.ScopeProjectId = @ScopeProjectId
                               ORDER BY a.UpdatedUtc DESC
                               OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;
                               """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                countSql,
                new
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        IEnumerable<ArchitectureIdentityListRow> rows = await connection.QueryAsync<ArchitectureIdentityListRow>(
            new CommandDefinition(
                listSql,
                new
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    Skip = effectiveSkip,
                    Take = effectiveTake,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        List<ArchitectureIdentityListItem> items = rows
            .Select(MapListRow)
            .ToList();

        return new ArchitectureIdentityListResult
        {
            Items = items,
            TotalCount = totalCount,
        };
    }

    public async Task<ArchitectureIdentityWithChildren?> GetWithChildrenAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityRecord? identity = await GetByIdAsync(scope, architectureId, cancellationToken).ConfigureAwait(false);

        if (identity is null)
            return null;

        const string currentDraftSql = """
                                       SELECT TOP (1)
                                           d.DraftId,
                                           COALESCE(NULLIF(LTRIM(RTRIM(JSON_VALUE(d.DocumentJson, '$.systemName'))), N''), @DisplayName) AS SystemName,
                                           d.UpdatedUtc,
                                           CASE
                                               WHEN d.Status = N'RunSpawned' OR d.SpawnedRunId IS NOT NULL THEN 1
                                               ELSE 0
                                           END AS SpawnLocked
                                       FROM dbo.DraftRequests d
                                       WHERE d.ArchitectureId = @ArchitectureId
                                         AND d.TenantId = @TenantId
                                         AND d.WorkspaceId = @WorkspaceId
                                         AND d.ProjectId = @ScopeProjectId
                                         AND d.Status <> N'RunSpawned'
                                         AND d.SpawnedRunId IS NULL
                                       ORDER BY d.UpdatedUtc DESC;
                                       """;

        const string reviewsSql = """
                                  SELECT TOP (50)
                                      r.RunId AS ReviewRunId,
                                      r.LegacyRunStatus AS Status,
                                      CASE WHEN r.GoldenManifestId IS NOT NULL THEN 1 ELSE 0 END AS IsSealed,
                                      r.CreatedUtc AS UpdatedUtc
                                  FROM dbo.Reviews r
                                  WHERE r.ArchitectureId = @ArchitectureId
                                    AND r.TenantId = @TenantId
                                    AND r.WorkspaceId = @WorkspaceId
                                    AND r.ScopeProjectId = @ScopeProjectId
                                  ORDER BY r.CreatedUtc DESC;
                                  """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        ArchitectureIdentityCurrentDraftRow? currentDraft = await connection.QuerySingleOrDefaultAsync<ArchitectureIdentityCurrentDraftRow>(
            new CommandDefinition(
                currentDraftSql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    DisplayName = identity.DisplayName,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        IEnumerable<ArchitectureIdentityReviewChildRow> reviewRows = await connection.QueryAsync<ArchitectureIdentityReviewChildRow>(
            new CommandDefinition(
                reviewsSql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        ArchitectureIdentityCurrentDraftSummary? currentDraftSummary = currentDraft is null
            ? null
            : new ArchitectureIdentityCurrentDraftSummary
            {
                DraftId = currentDraft.DraftId,
                SystemName = currentDraft.SystemName,
                UpdatedUtc = DateTime.SpecifyKind(currentDraft.UpdatedUtc, DateTimeKind.Utc),
                SpawnLocked = currentDraft.SpawnLocked,
            };

        List<ArchitectureIdentityReviewChildSummary> reviews = reviewRows
            .Select(row => new ArchitectureIdentityReviewChildSummary
            {
                ReviewRunId = row.ReviewRunId,
                Status = row.Status,
                IsSealed = row.IsSealed,
                UpdatedUtc = DateTime.SpecifyKind(row.UpdatedUtc, DateTimeKind.Utc),
            })
            .ToList();

        return new ArchitectureIdentityWithChildren
        {
            Identity = identity,
            CurrentDraft = currentDraftSummary,
            Reviews = reviews,
        };
    }

    public async Task<ArchitectureIdentityRecord?> UpdateDisplayNameAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        string? description,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string normalizedDisplayName = NormalizeRequiredDisplayName(displayName);
        string? normalizedDescription = NormalizeOptionalDescription(description);
        DateTime updatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        const string sql = """
                           UPDATE dbo.Architectures
                           SET DisplayName = @DisplayName,
                               Description = @Description,
                               UpdatedUtc = @UpdatedUtc
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;

                           SELECT @@ROWCOUNT;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int rows = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    DisplayName = normalizedDisplayName,
                    Description = normalizedDescription,
                    UpdatedUtc = updatedUtc,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (rows == 0)
            return null;

        return await GetByIdAsync(scope, architectureId, cancellationToken).ConfigureAwait(false);
    }

    public async Task UpdateCurrentModelAsync(
        ScopeContext scope,
        Guid architectureId,
        string currentModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(currentModelId);

        const string sql = """
                           UPDATE dbo.Architectures
                           SET CurrentModelId = @CurrentModelId,
                               UpdatedUtc = @UpdatedUtc
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    CurrentModelId = currentModelId,
                    UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task UpdateLatestSealedManifestAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid manifestId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           UPDATE dbo.Architectures
                           SET LatestSealedManifestId = @LatestSealedManifestId,
                               UpdatedUtc = @UpdatedUtc
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    LatestSealedManifestId = manifestId,
                    UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    private static ArchitectureIdentityListItem MapListRow(ArchitectureIdentityListRow row) =>
        new()
        {
            ArchitectureId = row.ArchitectureId,
            DisplayName = row.DisplayName,
            Description = row.Description,
            UpdatedUtc = DateTime.SpecifyKind(row.UpdatedUtc, DateTimeKind.Utc),
            LatestSealedManifestId = row.LatestSealedManifestId,
            ChildPointers = new ArchitectureIdentityChildPointers
            {
                CurrentOpenDraftId = row.CurrentOpenDraftId,
                CurrentOpenDraftSystemName = row.CurrentOpenDraftSystemName,
                CurrentOpenDraftUpdatedUtc = row.CurrentOpenDraftUpdatedUtc.HasValue
                    ? DateTime.SpecifyKind(row.CurrentOpenDraftUpdatedUtc.Value, DateTimeKind.Utc)
                    : null,
                CurrentOpenDraftSpawnLocked = row.CurrentOpenDraftSpawnLocked,
                LatestReviewRunId = row.LatestReviewRunId,
                LatestReviewUpdatedUtc = row.LatestReviewUpdatedUtc.HasValue
                    ? DateTime.SpecifyKind(row.LatestReviewUpdatedUtc.Value, DateTimeKind.Utc)
                    : null,
                DraftCount = row.DraftCount,
                ReviewCount = row.ReviewCount,
            },
        };

    private static string NormalizeRequiredDisplayName(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            throw new ArgumentException("DisplayName is required.", nameof(displayName));

        return displayName.Trim();
    }

    private static string? NormalizeOptionalDescription(string? description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return null;

        return description.Trim();
    }

    private sealed class ArchitectureIdentityListRow
    {
        public Guid ArchitectureId
        {
            get;
            set;
        }

        public string DisplayName
        {
            get;
            set;
        } = string.Empty;

        public string? Description
        {
            get;
            set;
        }

        public DateTime UpdatedUtc
        {
            get;
            set;
        }

        public Guid? LatestSealedManifestId
        {
            get;
            set;
        }

        public int DraftCount
        {
            get;
            set;
        }

        public int ReviewCount
        {
            get;
            set;
        }

        public Guid? CurrentOpenDraftId
        {
            get;
            set;
        }

        public string? CurrentOpenDraftSystemName
        {
            get;
            set;
        }

        public DateTime? CurrentOpenDraftUpdatedUtc
        {
            get;
            set;
        }

        public bool CurrentOpenDraftSpawnLocked
        {
            get;
            set;
        }

        public Guid? LatestReviewRunId
        {
            get;
            set;
        }

        public DateTime? LatestReviewUpdatedUtc
        {
            get;
            set;
        }
    }

    private sealed class ArchitectureIdentityCurrentDraftRow
    {
        public Guid DraftId
        {
            get;
            set;
        }

        public string SystemName
        {
            get;
            set;
        } = string.Empty;

        public DateTime UpdatedUtc
        {
            get;
            set;
        }

        public bool SpawnLocked
        {
            get;
            set;
        }
    }

    private sealed class ArchitectureIdentityReviewChildRow
    {
        public Guid ReviewRunId
        {
            get;
            set;
        }

        public string Status
        {
            get;
            set;
        } = string.Empty;

        public bool IsSealed
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
