namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Canonical SQL text for high-volume list/search paths (<c>dbo.Runs</c>, <c>dbo.AuditEvents</c>).
///     Unit tests assert shapes stay index-friendly without opening SQL connections.
/// </summary>
/// <remarks>
///     When changing repository queries, update these constants in the same PR and extend test assertions if new
///     predicates are required — see <c>docs/library/PERFORMANCE_BASELINES.md</c>.
/// </remarks>
internal static class HotPathRelationalQueryShapes
{
    /// <summary>Dashboard run list by project slug (<c>SqlRunRepository.ListByProjectAsync</c>).</summary>
    public const string RunsListByProjectNoLock = $"""
                                                  SELECT TOP (@Take)
                                                      {RunListWarningFlagSql.SelectRunColumns},
                                                      {RunListWarningFlagSql.SelectColumns}
                                                  {RunListWarningFlagSql.FromRunsNoLock}
                                                  {RunListWarningFlagSql.LeftJoinAggregates}
                                                  WHERE {RunListWarningFlagSql.ProjectWherePrefix}
                                                    {RunListWarningFlagSql.ScopeWhereTail}
                                                  {RunListWarningFlagSql.CreatedUtcDescOrderBy};
                                                  """;

    /// <summary>Keyset-paged run list by project (<c>SqlRunRepository.ListByProjectKeysetAsync</c>).</summary>
    public const string RunsListByProjectKeysetNoLock = $"""
                                                        SELECT TOP (@Fetch)
                                                            {RunListWarningFlagSql.SelectRunColumns},
                                                            {RunListWarningFlagSql.SelectColumns}
                                                        {RunListWarningFlagSql.FromRunsNoLock}
                                                        {RunListWarningFlagSql.LeftJoinAggregates}
                                                        WHERE {RunListWarningFlagSql.ProjectWherePrefix}
                                                          {RunListWarningFlagSql.ScopeWhereTail}
                                                          {RunListWarningFlagSql.KeysetCursorPredicate}
                                                        {RunListWarningFlagSql.KeysetOrderBy};
                                                        """;

    /// <summary>
    ///     EXISTS predicate for committed architecture reviews with persisted golden manifests (nav narrowing signal).
    /// </summary>
    public const string CommittedArchitectureReviewExistsNoLock = """
                                                                  SELECT CASE WHEN EXISTS (
                                                                      SELECT 1
                                                                      FROM dbo.Runs r WITH (NOLOCK)
                                                                      INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                                                                          ON gm.ManifestId = r.GoldenManifestId AND gm.TenantId = r.TenantId
                                                                      WHERE r.TenantId = @TenantId
                                                                        AND r.WorkspaceId = @WorkspaceId
                                                                        AND r.ScopeProjectId = @ScopeProjectId
                                                                        AND r.ArchivedUtc IS NULL
                                                                        AND gm.ArchivedUtc IS NULL
                                                                        AND r.LegacyRunStatus = @CommittedStatus
                                                                        AND r.GoldenManifestId IS NOT NULL
                                                                  ) THEN 1 ELSE 0 END;
                                                                  """;

    /// <summary>Recent runs in ambient scope (<c>SqlRunRepository.ListRecentInScopeAsync</c>).</summary>
    public const string RunsListRecentInScopeNoLock = $"""
                                                      SELECT TOP (@Take)
                                                          {RunListWarningFlagSql.SelectRunColumns},
                                                          {RunListWarningFlagSql.SelectColumns}
                                                      {RunListWarningFlagSql.FromRunsNoLock}
                                                      {RunListWarningFlagSql.LeftJoinAggregates}
                                                      WHERE {RunListWarningFlagSql.ScopeWhereTail}
                                                      {RunListWarningFlagSql.CreatedUtcDescOrderBy};
                                                      """;

    /// <summary>Offset-paged recent runs in scope (<c>SqlRunRepository.ListRecentInScopeOffsetAsync</c>).</summary>
    public const string RunsListRecentInScopeOffsetNoLock = $"""
                                                            SELECT
                                                                {RunListWarningFlagSql.SelectRunColumns},
                                                                {RunListWarningFlagSql.SelectColumns}
                                                            {RunListWarningFlagSql.FromRunsNoLock}
                                                            {RunListWarningFlagSql.LeftJoinAggregates}
                                                            WHERE {RunListWarningFlagSql.ScopeWhereTail}
                                                            {RunListWarningFlagSql.CreatedUtcDescOrderBy}
                                                            OFFSET @Offset ROWS FETCH NEXT @Fetch ROWS ONLY;
                                                            """;

    /// <summary>Keyset recent runs in scope (<c>SqlRunRepository.ListRecentInScopeKeysetAsync</c>).</summary>
    public const string RunsListRecentInScopeKeysetNoLock = $"""
                                                            SELECT TOP (@Fetch)
                                                                {RunListWarningFlagSql.SelectRunColumns},
                                                                {RunListWarningFlagSql.SelectColumns}
                                                            {RunListWarningFlagSql.FromRunsNoLock}
                                                            {RunListWarningFlagSql.LeftJoinAggregates}
                                                            WHERE {RunListWarningFlagSql.ScopeWhereTail}
                                                              {RunListWarningFlagSql.KeysetCursorPredicate}
                                                            {RunListWarningFlagSql.KeysetOrderBy};
                                                            """;

    /// <summary>Default audit timeline (<c>DapperAuditRepository.GetByScopeAsync</c>); omits <c>DataJson</c> (TB-577).</summary>
    public const string AuditEventsGetByScopeNoLock = $"""
                                                SELECT TOP (@Take)
                                                    {AuditEventListSql.SelectColumnsWithoutDataJson}
                                                FROM dbo.AuditEvents WITH (NOLOCK)
                                                WHERE TenantId = @TenantId
                                                  AND WorkspaceId = @WorkspaceId
                                                  AND ProjectId = @ProjectId
                                                ORDER BY OccurredUtc DESC, EventId DESC;
                                                """;

    /// <summary>
    ///     Opening clause for filtered audit search (<c>DapperAuditRepository.GetFilteredAsync</c>);
    ///     dynamic filters append <c>AND …</c> before <see cref="AuditEventsFilteredOrderByOccurredUtcEventIdDesc" />.
    ///     Omits <c>DataJson</c> unless <see cref="AuditEventFilter.IncludeDataJson" /> (TB-577).
    /// </summary>
    public const string AuditEventsFilteredSelectFromWhereScopeNoLock = $"""
                                                                  SELECT TOP (@Take)
                                                                      {AuditEventListSql.SelectColumnsWithoutDataJson}
                                                                  FROM dbo.AuditEvents WITH (NOLOCK)
                                                                  WHERE TenantId = @TenantId
                                                                    AND WorkspaceId = @WorkspaceId
                                                                    AND ProjectId = @ProjectId
                                                                  """;

    /// <summary>
    ///     Filtered audit export/stream opening clause including full <c>DataJson</c> payload.
    /// </summary>
    public const string AuditEventsFilteredSelectFromWhereScopeWithDataJsonNoLock = """
                                                                  SELECT TOP (@Take)
                                                                      EventId, OccurredUtc, EventType,
                                                                      ActorUserId, ActorUserName,
                                                                      TenantId, WorkspaceId, ProjectId,
                                                                      RunId, ManifestId, ArtifactId,
                                                                      DataJson, CorrelationId
                                                                  FROM dbo.AuditEvents WITH (NOLOCK)
                                                                  WHERE TenantId = @TenantId
                                                                    AND WorkspaceId = @WorkspaceId
                                                                    AND ProjectId = @ProjectId
                                                                  """;

    /// <summary>Stable keyset ordering for audit search/export listings.</summary>
    public const string AuditEventsFilteredOrderByOccurredUtcEventIdDesc = """
                                                                           ORDER BY OccurredUtc DESC, EventId DESC;
                                                                           """;

    /// <summary>Chronological ordering for filtered CSV/JSON audit export (<c>GetFilteredExportAsync</c>).</summary>
    public const string AuditEventsFilteredOrderByOccurredUtcEventIdAsc = """
                                                                          ORDER BY OccurredUtc ASC, EventId ASC;
                                                                          """;

    /// <summary>Opening clause for <c>DapperAuditRepository.CountFilteredAsync</c>; dynamic filters append before terminator.</summary>
    public const string AuditEventsFilteredCountFromWhereScopeNoLock = """
                                                                 SELECT COUNT(*)
                                                                 FROM dbo.AuditEvents WITH (NOLOCK)
                                                                 WHERE TenantId = @TenantId
                                                                   AND WorkspaceId = @WorkspaceId
                                                                   AND ProjectId = @ProjectId
                                                                 """;
}
