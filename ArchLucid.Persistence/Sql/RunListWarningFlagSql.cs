namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Warning flags for run list queries — LEFT JOIN aggregates instead of per-row correlated EXISTS (TB-576).
/// </summary>
internal static class RunListWarningFlagSql
{
    /// <summary><c>dbo.Runs</c> alias for list paths that attach <see cref="LeftJoinAggregates" />.</summary>
    public const string RunsTableAlias = "r";

    /// <summary>Opening FROM clause; pair with <see cref="LeftJoinAggregates" />.</summary>
    public const string FromRunsNoLock = "FROM dbo.Runs r WITH (NOLOCK)";

    /// <summary>
    ///     Core run columns for dashboard list paths. All columns use <see cref="RunsTableAlias" /> because
    ///     fsWarn/govWarn also project <c>RunId</c>. Omits <c>EngineProvenanceJson</c> (TB-585); detail reads load it separately.
    /// </summary>
    public const string SelectRunColumns = """
                                           r.RunId, r.TenantId, r.WorkspaceId, r.ScopeProjectId, r.ProjectId, r.Description, r.CreatedUtc,
                                           r.ContextSnapshotId, r.GraphSnapshotId, r.FindingsSnapshotId,
                                           r.GoldenManifestId, r.DecisionTraceId, r.ArtifactBundleId, r.ArchivedUtc,
                                           r.ArchitectureRequestId, r.LegacyRunStatus, r.CompletedUtc, r.CurrentManifestVersion, r.OtelTraceId,
                                           r.IsDemoWelcomeRun,
                                           r.IsPublicShowcase, r.IsPinned, r.RealModeFellBackToSimulator, r.PilotAoaiDeploymentSnapshot,
                                           r.StructuralExecutionMode,
                                           r.RetryCount, r.LastFailureReason,
                                           COALESCE(
                                               r.PackageOrigin,
                                               CASE
                                                   WHEN JSON_VALUE(ar.RequestJson, '$.workflowIntent') = N'create-architecture'
                                                       THEN N'Created'
                                                   ELSE N'Reviewed'
                                               END) AS PackageOrigin
                                           """;

    /// <summary>Projected columns; pair with <see cref="LeftJoinAggregates" /> after <see cref="FromRunsNoLock" />.</summary>
    public const string SelectColumns = """
                                        ISNULL(fsWarn.HasWarnings, 0) AS HasWarnings,
                                        ISNULL(govWarn.HasGovernanceWarnings, 0) AS HasGovernanceWarnings
                                        """;

    /// <summary>Ambient scope filter shared by recent-in-scope list shapes.</summary>
    public const string ScopeWhereTail = """
                                         r.TenantId = @TenantId
                                           AND r.WorkspaceId = @WorkspaceId
                                           AND r.ScopeProjectId = @ScopeProjectId
                                           AND r.ArchivedUtc IS NULL
                                         """;

    /// <summary>
    ///     Project filter for per-project list shapes.
    ///     Matches human project slug (<c>Runs.ProjectId</c>) or scope project GUID
    ///     (<c>Runs.ScopeProjectId</c>) — demo seeds store display names in <c>ProjectId</c>
    ///     while UI/live E2E list by the stable scope project id.
    /// </summary>
    public const string ProjectWherePrefix = """
                                             (
                                                 r.ProjectId = @ProjectSlug
                                                 OR r.ScopeProjectId = TRY_CONVERT(uniqueidentifier, @ProjectSlug)
                                             )
                                               AND
                                             """;

    /// <summary>Keyset continuation predicate for run lists ordered by created time then run id.</summary>
    public const string KeysetCursorPredicate = """
                                                AND (
                                                    (@CursorRunId IS NULL AND @CursorCreatedUtc IS NULL)
                                                    OR (
                                                        r.RunId <> @CursorRunId
                                                        AND (
                                                            r.CreatedUtc < @CursorCreatedUtc
                                                            OR (r.CreatedUtc = @CursorCreatedUtc AND r.RunId < @CursorRunId)
                                                        )
                                                    )
                                                )
                                                """;

    /// <summary>Stable keyset ordering for run lists.</summary>
    public const string KeysetOrderBy = "ORDER BY r.CreatedUtc DESC, r.RunId DESC";

    /// <summary>Default recent-first ordering for unpaged run lists.</summary>
    public const string CreatedUtcDescOrderBy = "ORDER BY r.CreatedUtc DESC";

    /// <summary>
    ///     Pre-aggregated findings and open-alert presence keyed by <c>RunId</c> for dashboard list paths.
    /// </summary>
    public const string LeftJoinAggregates = """
                                             LEFT JOIN (
                                                 SELECT
                                                     fs.RunId,
                                                     CAST(MAX(CASE WHEN fs.HasWarnings = 1 THEN 1 ELSE 0 END) AS bit) AS HasWarnings
                                                 FROM dbo.FindingsSnapshots fs WITH (NOLOCK)
                                                 WHERE fs.ArchivedUtc IS NULL
                                                 GROUP BY fs.RunId
                                             ) fsWarn ON fsWarn.RunId = r.RunId
                                             LEFT JOIN (
                                                 SELECT
                                                     ar.RunId,
                                                     CAST(1 AS bit) AS HasGovernanceWarnings
                                                 FROM dbo.AlertRecords ar WITH (NOLOCK)
                                                 WHERE ar.Status = N'Open'
                                                 GROUP BY ar.RunId
                                             ) govWarn ON govWarn.RunId = r.RunId
                                             LEFT JOIN dbo.ArchitectureRequests ar WITH (NOLOCK)
                                                 ON ar.RequestId = r.ArchitectureRequestId
                                             """;
}
