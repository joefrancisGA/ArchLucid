using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlArchitectureIdentityRepository
{
    public async Task<ArchitectureIdentityListPage> ListAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);

        string archivedFilterSql = includeArchived ? string.Empty : " AND a.ArchivedUtc IS NULL";

        string countSql = $"""
                           SELECT COUNT(1)
                           FROM dbo.Architectures a
                           WHERE a.TenantId = @TenantId
                             AND a.WorkspaceId = @WorkspaceId
                             AND a.ScopeProjectId = @ScopeProjectId
                             {archivedFilterSql};
                           """;

        string listSql = $"""
                          SELECT
                              a.ArchitectureId,
                              a.DisplayName,
                              a.UpdatedUtc,
                              a.ArchivedUtc,
                              a.LatestSealedManifestId,
                              (
                                  SELECT TOP (1) d.DraftId
                                  FROM dbo.DraftRequests d
                                  WHERE d.ArchitectureId = a.ArchitectureId
                                    AND d.TenantId = @TenantId
                                    AND d.WorkspaceId = @WorkspaceId
                                    AND d.ProjectId = @ScopeProjectId
                                  ORDER BY d.UpdatedUtc DESC, d.DraftId DESC
                              ) AS CurrentDraftId,
                              (
                                  SELECT TOP (1) r.RunId
                                  FROM dbo.Runs r
                                  WHERE r.ArchitectureId = a.ArchitectureId
                                    AND r.TenantId = @TenantId
                                    AND r.WorkspaceId = @WorkspaceId
                                    AND r.ScopeProjectId = @ScopeProjectId
                                    AND r.ArchivedUtc IS NULL
                                  ORDER BY r.CreatedUtc DESC, r.RunId DESC
                              ) AS LatestReviewId,
                              (
                                  SELECT COUNT(1)
                                  FROM dbo.DraftRequests d
                                  WHERE d.ArchitectureId = a.ArchitectureId
                                    AND d.TenantId = @TenantId
                                    AND d.WorkspaceId = @WorkspaceId
                                    AND d.ProjectId = @ScopeProjectId
                              ) AS DraftCount,
                              (
                                  SELECT COUNT(1)
                                  FROM dbo.Runs r
                                  WHERE r.ArchitectureId = a.ArchitectureId
                                    AND r.TenantId = @TenantId
                                    AND r.WorkspaceId = @WorkspaceId
                                    AND r.ScopeProjectId = @ScopeProjectId
                                    AND r.ArchivedUtc IS NULL
                              ) AS ReviewCount
                          FROM dbo.Architectures a
                          WHERE a.TenantId = @TenantId
                            AND a.WorkspaceId = @WorkspaceId
                            AND a.ScopeProjectId = @ScopeProjectId
                            {archivedFilterSql}
                          ORDER BY a.UpdatedUtc DESC, a.ArchitectureId DESC
                          OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
                          """;

        object parameters = new
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Skip = skip,
            PageSize = safePageSize,
        };

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken)).ConfigureAwait(false);

        IEnumerable<ArchitectureIdentityListItem> rows = await connection.QueryAsync<ArchitectureIdentityListItem>(
            new CommandDefinition(listSql, parameters, cancellationToken: cancellationToken)).ConfigureAwait(false);

        IReadOnlyList<ArchitectureIdentityListItem> items = rows.ToList();

        int archivedHiddenCount = includeArchived
            ? 0
            : await CountArchivedInScopeAsync(scope, cancellationToken).ConfigureAwait(false);

        return new ArchitectureIdentityListPage
        {
            Items = items,
            TotalCount = totalCount,
            Page = safePage,
            PageSize = safePageSize,
            ArchivedHiddenCount = archivedHiddenCount,
        };
    }

    public async Task<ArchitectureIdentityDetail?> GetDetailAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureIdentityRecord? identity = await GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (identity is null)
            return null;

        const string draftSql = """
                                SELECT
                                    d.DraftId,
                                    d.Status,
                                    d.UpdatedUtc,
                                    JSON_VALUE(d.DocumentJson, '$.systemName') AS SystemName
                                FROM dbo.DraftRequests d
                                WHERE d.ArchitectureId = @ArchitectureId
                                  AND d.TenantId = @TenantId
                                  AND d.WorkspaceId = @WorkspaceId
                                  AND d.ProjectId = @ScopeProjectId
                                ORDER BY d.UpdatedUtc DESC, d.DraftId DESC;
                                """;

        const string reviewSql = """
                                 SELECT
                                     r.RunId,
                                     r.Description,
                                     r.CreatedUtc
                                 FROM dbo.Runs r
                                 WHERE r.ArchitectureId = @ArchitectureId
                                   AND r.TenantId = @TenantId
                                   AND r.WorkspaceId = @WorkspaceId
                                   AND r.ScopeProjectId = @ScopeProjectId
                                   AND r.ArchivedUtc IS NULL
                                 ORDER BY r.CreatedUtc DESC, r.RunId DESC;
                                 """;

        object parameters = new
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        IReadOnlyList<ArchitectureIdentityChildDraftSummary> drafts = (await connection
            .QueryAsync<ArchitectureIdentityChildDraftRow>(
                new CommandDefinition(draftSql, parameters, cancellationToken: cancellationToken))
            .ConfigureAwait(false)).Select(MapDraftSummary).ToList();

        IReadOnlyList<ArchitectureIdentityChildReviewSummary> reviews = (await connection
            .QueryAsync<ArchitectureIdentityChildReviewRow>(
                new CommandDefinition(reviewSql, parameters, cancellationToken: cancellationToken))
            .ConfigureAwait(false)).Select(MapReviewSummary).ToList();

        const string versionSql = """
                                  SELECT
                                      v.ArchitectureVersionId,
                                      v.VersionNumber,
                                      v.CreatedUtc,
                                      (
                                          SELECT TOP (1) r.RunId
                                          FROM dbo.Runs r
                                          WHERE r.ArchitectureVersionId = v.ArchitectureVersionId
                                            AND r.TenantId = @TenantId
                                            AND r.WorkspaceId = @WorkspaceId
                                            AND r.ScopeProjectId = @ScopeProjectId
                                            AND r.ArchivedUtc IS NULL
                                          ORDER BY r.CreatedUtc DESC, r.RunId DESC
                                      ) AS LinkedReviewId
                                  FROM dbo.ArchitectureVersions v
                                  WHERE v.ArchitectureId = @ArchitectureId
                                    AND v.TenantId = @TenantId
                                    AND v.WorkspaceId = @WorkspaceId
                                    AND v.ScopeProjectId = @ScopeProjectId
                                  ORDER BY v.VersionNumber DESC;
                                  """;

        IReadOnlyList<ArchitectureIdentityVersionSummary> versions = (await connection
            .QueryAsync<ArchitectureIdentityVersionRow>(
                new CommandDefinition(versionSql, parameters, cancellationToken: cancellationToken))
            .ConfigureAwait(false)).Select(MapVersionSummary).ToList();

        Guid? currentDraftId = SelectCurrentDraftId(drafts);
        Guid? latestReviewId = reviews.FirstOrDefault()?.RunId;

        return new ArchitectureIdentityDetail
        {
            ArchitectureId = identity.ArchitectureId,
            DisplayName = identity.DisplayName,
            Description = identity.Description,
            CurrentModelId = identity.CurrentModelId,
            LatestSealedManifestId = identity.LatestSealedManifestId,
            CurrentDraftId = currentDraftId == Guid.Empty ? null : currentDraftId,
            LatestReviewId = latestReviewId == Guid.Empty ? null : latestReviewId,
            DraftCount = drafts.Count,
            ReviewCount = reviews.Count,
            CreatedUtc = identity.CreatedUtc,
            UpdatedUtc = identity.UpdatedUtc,
            ArchivedUtc = identity.ArchivedUtc,
            Drafts = drafts,
            Reviews = reviews,
            Versions = versions,
        };
    }

    private static Guid? SelectCurrentDraftId(IReadOnlyList<ArchitectureIdentityChildDraftSummary> drafts)
    {
        ArchitectureIdentityChildDraftSummary? draftingDraft = drafts.FirstOrDefault(draft => draft.Status == DraftRequestStatus.Drafting);

        if (draftingDraft is not null)
            return draftingDraft.DraftId;

        ArchitectureIdentityChildDraftSummary? spawnLockedDraft = drafts.FirstOrDefault(draft => draft.Status == DraftRequestStatus.RunSpawned);

        if (spawnLockedDraft is not null)
            return spawnLockedDraft.DraftId;

        return null;
    }

    private static ArchitectureIdentityVersionSummary MapVersionSummary(ArchitectureIdentityVersionRow row) =>
        new()
        {
            ArchitectureVersionId = row.ArchitectureVersionId,
            VersionNumber = row.VersionNumber,
            CreatedUtc = DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc),
            LinkedReviewId = row.LinkedReviewId == Guid.Empty ? null : row.LinkedReviewId,
        };

    private static ArchitectureIdentityChildDraftSummary MapDraftSummary(ArchitectureIdentityChildDraftRow row) =>
        new()
        {
            DraftId = row.DraftId,
            Status = Enum.TryParse(row.Status, true, out DraftRequestStatus parsed)
                ? parsed
                : DraftRequestStatus.Drafting,
            SystemName = row.SystemName,
            UpdatedUtc = DateTime.SpecifyKind(row.UpdatedUtc, DateTimeKind.Utc),
        };

    private static ArchitectureIdentityChildReviewSummary MapReviewSummary(ArchitectureIdentityChildReviewRow row) =>
        new()
        {
            RunId = row.RunId,
            Description = row.Description,
            CreatedUtc = DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc),
        };

    private sealed class ArchitectureIdentityChildDraftRow
    {
        public Guid DraftId
        {
            get;
            set;
        }

        public string Status
        {
            get;
            set;
        } = string.Empty;

        public string? SystemName
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

    private sealed class ArchitectureIdentityChildReviewRow
    {
        public Guid RunId
        {
            get;
            set;
        }

        public string? Description
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }
    }

    private sealed class ArchitectureIdentityVersionRow
    {
        public Guid ArchitectureVersionId
        {
            get;
            set;
        }

        public int VersionNumber
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public Guid LinkedReviewId
        {
            get;
            set;
        }
    }
}
