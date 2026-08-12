namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Scoped read shapes for <c>dbo.AgentExecutionTraces</c> joined to <c>dbo.Runs</c> (TB-076).
/// </summary>
internal static class AgentExecutionTraceQueryShapes
{
    private const string TraceAlias = "t";
    private const string RunsAlias = "run_scope";

    private const string ScopedInnerJoinRuns =
        $"INNER JOIN dbo.Runs {RunsAlias} ON {RunsAlias}.RunId = {TraceAlias}.RunId AND {RunsAlias}.ArchivedUtc IS NULL";

    private const string ScopedRunChildWhere =
        $"{RunsAlias}.TenantId = @TenantId AND {RunsAlias}.WorkspaceId = @WorkspaceId AND {RunsAlias}.ScopeProjectId = @ScopeProjectId";

    private const string ScopedJoin = $"""
                                       FROM AgentExecutionTraces {TraceAlias}
                                       {ScopedInnerJoinRuns}
                                       """;

    private const string ScopedRunIdWhere = $"""
                                             WHERE {TraceAlias}.RunId = @RunId
                                               AND {ScopedRunChildWhere}
                                             """;

    private const string ScopedRunIdsInWhere = $"""
                                                WHERE {TraceAlias}.RunId IN @RunIds
                                                  AND {ScopedRunChildWhere}
                                                """;

    private const string FirstFiveHundredRows = "OFFSET 0 ROWS FETCH NEXT 500 ROWS ONLY";

    public const string SelectTraceJsonByRunId = $"""
                                                  SELECT {TraceAlias}.TraceJson
                                                  {ScopedJoin}
                                                  {ScopedRunIdWhere}
                                                  ORDER BY {TraceAlias}.CreatedUtc
                                                  {FirstFiveHundredRows};
                                                  """;

    public const string SelectLlmCostSlicesByRunId = $"""
                                                      SELECT {AgentExecutionTraceLlmCostProjectionSql.SelectColumns}
                                                      {ScopedJoin}
                                                      {ScopedRunIdWhere}
                                                      ORDER BY {TraceAlias}.CreatedUtc
                                                      {FirstFiveHundredRows};
                                                      """;

    public const string SelectLlmCostSlicesByRunIds = $"""
                                                       SELECT {TraceAlias}.RunId,
                                                              {AgentExecutionTraceLlmCostProjectionSql.SelectColumns}
                                                       {ScopedJoin}
                                                       {ScopedRunIdsInWhere}
                                                       ORDER BY {TraceAlias}.RunId, {TraceAlias}.CreatedUtc;
                                                       """;

    public const string SelectTraceJsonPagedByRunId = $"""
                                                       SELECT {TraceAlias}.TraceJson,
                                                              COUNT(*) OVER () AS TotalCount
                                                       {ScopedJoin}
                                                       {ScopedRunIdWhere}
                                                       ORDER BY {TraceAlias}.CreatedUtc
                                                       OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                                                       """;

    public const string SelectSummariesPagedByRunId = $"""
                                                         SELECT {AgentExecutionTraceListSql.SelectSummaryColumns},
                                                                COUNT(*) OVER () AS TotalCount
                                                         {ScopedJoin}
                                                         {ScopedRunIdWhere}
                                                         ORDER BY {TraceAlias}.CreatedUtc
                                                         OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                                                         """;

    public const string CountByRunId = $"""
                                        SELECT COUNT(1)
                                        {ScopedJoin}
                                        {ScopedRunIdWhere};
                                        """;

    public const string SelectTraceJsonByTaskId = $"""
                                                   SELECT TraceJson
                                                   FROM AgentExecutionTraces
                                                   WHERE TaskId = @TaskId
                                                   ORDER BY CreatedUtc
                                                   {FirstFiveHundredRows};
                                                   """;

    public const string SelectDistinctAgentTypesWithLlmFallbackByRunIds = $"""
                                                                         SELECT DISTINCT {TraceAlias}.RunId, {TraceAlias}.AgentType
                                                                         FROM dbo.AgentExecutionTraces {TraceAlias}
                                                                         {ScopedInnerJoinRuns}
                                                                         {ScopedRunIdsInWhere}
                                                                           AND {TraceAlias}.ModelDeploymentName LIKE @PrefixPattern
                                                                         """;
}
