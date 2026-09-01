namespace ArchLucid.Persistence.Sql;

internal static partial class RunRepositorySql
{
    public const string SelectLatestCommittedRunIdByManifestCreatedUtc = """
                                                                         SELECT TOP (1) r.RunId
                                                                         FROM dbo.Runs r WITH (NOLOCK)
                                                                         INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                                                                             ON gm.ManifestId = r.GoldenManifestId
                                                                         WHERE r.TenantId = @TenantId
                                                                           AND r.WorkspaceId = @WorkspaceId
                                                                           AND r.ScopeProjectId = @ScopeProjectId
                                                                           AND UPPER(LTRIM(RTRIM(r.ProjectId))) = @NormalizedAuthorityProjectSlug
                                                                           AND r.ArchivedUtc IS NULL
                                                                           AND gm.ArchivedUtc IS NULL
                                                                           AND (
                                                                                r.LegacyRunStatus = @CommittedStatus
                                                                                OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                                OR r.GoldenManifestId IS NOT NULL
                                                                           )
                                                                         ORDER BY gm.CreatedUtc DESC, r.RunId DESC;
                                                                         """;

    public const string SelectPriorCommittedRunIdBeforeCurrent = """
                                                                 SELECT TOP (1) r.RunId
                                                                 FROM dbo.Runs r WITH (NOLOCK)
                                                                 INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                                                                     ON gm.ManifestId = r.GoldenManifestId
                                                                 WHERE r.TenantId = @TenantId
                                                                   AND r.WorkspaceId = @WorkspaceId
                                                                   AND r.ScopeProjectId = @ScopeProjectId
                                                                   AND UPPER(LTRIM(RTRIM(r.ProjectId))) = @NormalizedAuthorityProjectSlug
                                                                   AND r.ArchivedUtc IS NULL
                                                                   AND gm.ArchivedUtc IS NULL
                                                                   AND r.RunId <> @CurrentRunId
                                                                   AND (
                                                                        r.CreatedUtc < @CurrentCreatedUtc
                                                                        OR (r.CreatedUtc = @CurrentCreatedUtc AND r.RunId < @CurrentRunId)
                                                                   )
                                                                   AND (
                                                                        r.LegacyRunStatus = @CommittedStatus
                                                                        OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                        OR r.GoldenManifestId IS NOT NULL
                                                                   )
                                                                 ORDER BY r.CreatedUtc DESC, r.RunId DESC;
                                                                 """;

    public const string SelectPriorCommittedRunIdForArchitectureBeforeCurrent = """
                                                                 SELECT TOP (1) r.RunId
                                                                 FROM dbo.Runs r WITH (NOLOCK)
                                                                 INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                                                                     ON gm.ManifestId = r.GoldenManifestId
                                                                 WHERE r.TenantId = @TenantId
                                                                   AND r.WorkspaceId = @WorkspaceId
                                                                   AND r.ScopeProjectId = @ScopeProjectId
                                                                   AND r.ArchitectureId = @ArchitectureId
                                                                   AND r.ArchivedUtc IS NULL
                                                                   AND gm.ArchivedUtc IS NULL
                                                                   AND r.RunId <> @CurrentRunId
                                                                   AND (
                                                                        r.CreatedUtc < @CurrentCreatedUtc
                                                                        OR (r.CreatedUtc = @CurrentCreatedUtc AND r.RunId < @CurrentRunId)
                                                                   )
                                                                   AND (
                                                                        r.LegacyRunStatus = @CommittedStatus
                                                                        OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                        OR r.GoldenManifestId IS NOT NULL
                                                                   )
                                                                 ORDER BY r.CreatedUtc DESC, r.RunId DESC;
                                                                 """;

    public const string SelectCommittedRunIdByGoldenManifestId = """
                                                                 SELECT TOP (1) r.RunId
                                                                 FROM dbo.Runs r WITH (NOLOCK)
                                                                 WHERE r.TenantId = @TenantId
                                                                   AND r.WorkspaceId = @WorkspaceId
                                                                   AND r.ScopeProjectId = @ScopeProjectId
                                                                   AND r.ArchitectureId = @ArchitectureId
                                                                   AND r.GoldenManifestId = @GoldenManifestId
                                                                   AND r.ArchivedUtc IS NULL
                                                                   AND r.RunId <> @ExcludeRunId
                                                                   AND (
                                                                        r.LegacyRunStatus = @CommittedStatus
                                                                        OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                                        OR r.GoldenManifestId IS NOT NULL
                                                                   )
                                                                 ORDER BY r.CreatedUtc DESC, r.RunId DESC;
                                                                 """;

    public const string ClearGraphSnapshotForArchitecture = """
                                                            UPDATE dbo.Runs
                                                            SET GraphSnapshotId = NULL
                                                            WHERE TenantId = @TenantId
                                                              AND WorkspaceId = @WorkspaceId
                                                              AND ScopeProjectId = @ScopeProjectId
                                                              AND ArchitectureId = @ArchitectureId
                                                              AND ArchivedUtc IS NULL
                                                              AND GraphSnapshotId IS NOT NULL;
                                                            """;

    public const string SelectLatestRunIdForArchitecture = """
                                                             SELECT TOP (1) r.RunId
                                                             FROM dbo.Runs r WITH (NOLOCK)
                                                             WHERE r.TenantId = @TenantId
                                                               AND r.WorkspaceId = @WorkspaceId
                                                               AND r.ScopeProjectId = @ScopeProjectId
                                                               AND r.ArchitectureId = @ArchitectureId
                                                               AND r.ArchivedUtc IS NULL
                                                             ORDER BY r.CreatedUtc DESC, r.RunId DESC;
                                                             """;
}
