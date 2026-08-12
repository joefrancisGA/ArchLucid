using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Composes the <c>dbo.AgentResults</c> read statements. Every read joins <c>dbo.Runs</c> for tenant scope because
///     <c>AgentResults</c> does not denormalize the scope triple, so the run row is the only authority on ownership.
/// </summary>
internal static class AgentResultStatementFactory
{
    /// <summary>
    ///     Hard row cap on per-run reads: a run cannot legitimately produce this many agent results, so the cap bounds
    ///     memory instead of paging a list the callers always consume whole.
    /// </summary>
    private const int MaxRunResultRows = 1000;

    /// <summary>Full <c>ResultJson</c> per result for commit / detail orchestration.</summary>
    public static string BuildSelectResultJsonByRunId() =>
        BuildRunScopedSelect(AgentResultListSql.GetByRunIdSelectResultJson);

    /// <summary>Agent-type grounding markers without <c>ResultJson</c> (TB-930).</summary>
    public static string BuildSelectAgentTypeMarkersByRunId() =>
        BuildRunScopedSelect(AgentResultListSql.GetByRunIdSelectAgentTypeMarkers);

    /// <summary>Rollup/compare projection using <c>JSON_QUERY</c> subpaths instead of the whole LOB (TB-2053).</summary>
    public static string BuildSelectRollupProjectionByRunId() =>
        BuildRunScopedSelect(AgentResultListSql.GetByRunIdSelectRollupProjection);

    /// <summary>
    ///     Unpromoted evidence proposals. A proposal counts as promoted when either the legacy column or the enrichment
    ///     row carries a promotion timestamp, or a curated evidence entry already cites the result.
    /// </summary>
    public static string BuildListEvidenceProposals() =>
        $"""
         SELECT
             {AgentResultListSql.ListEvidenceProposalsSelectColumns},
             CAST(0 AS BIT) AS IsPromoted
         FROM AgentResults AS ar
         LEFT JOIN dbo.AgentResultEnrichments AS enr ON enr.ResultId = ar.ResultId
         {PersistenceTenantScope.InnerJoinRuns("ar")}
         WHERE ar.ProposedEvidenceJson IS NOT NULL
           AND ar.EvidenceProposalPromotedUtc IS NULL
           AND enr.EvidenceProposalPromotedUtc IS NULL
           AND {PersistenceTenantScope.RunChildScopeWhereClause}
           AND NOT EXISTS (
               SELECT 1
               FROM TenantCuratedEvidenceEntries AS tce
               WHERE tce.SourceResultId = ar.ResultId
                 AND tce.TenantId = @TenantId)
         ORDER BY ar.CreatedUtc DESC;
         """;

    /// <summary>
    ///     Single evidence proposal including promoted ones, so callers can render "already promoted" instead of a 404.
    /// </summary>
    public static string BuildSelectEvidenceProposalByResultId() =>
        $"""
         SELECT TOP (1)
             {AgentResultListSql.ListEvidenceProposalsSelectColumns},
             CASE
                 WHEN enr.EvidenceProposalPromotedUtc IS NOT NULL
                      OR ar.EvidenceProposalPromotedUtc IS NOT NULL
                      OR EXISTS (
                          SELECT 1
                          FROM TenantCuratedEvidenceEntries AS tce
                          WHERE tce.SourceResultId = ar.ResultId
                            AND tce.TenantId = @TenantId)
                 THEN CAST(1 AS BIT)
                 ELSE CAST(0 AS BIT)
             END AS IsPromoted
         FROM AgentResults AS ar
         LEFT JOIN dbo.AgentResultEnrichments AS enr ON enr.ResultId = ar.ResultId
         {PersistenceTenantScope.InnerJoinRuns("ar")}
         WHERE ar.ResultId = @ResultId
           AND ar.ProposedEvidenceJson IS NOT NULL
           AND {PersistenceTenantScope.RunChildScopeWhereClause};
         """;

    private static string BuildRunScopedSelect(string selectClause) =>
        $"""
         {selectClause}
         FROM AgentResults ar
         {PersistenceTenantScope.InnerJoinRuns("ar")}
         WHERE ar.RunId = @RunId
           AND {PersistenceTenantScope.RunChildScopeWhereClause}
         ORDER BY ar.CreatedUtc
         {SqlPagingSyntax.FirstRowsOnly(MaxRunResultRows)};
         """;
}
