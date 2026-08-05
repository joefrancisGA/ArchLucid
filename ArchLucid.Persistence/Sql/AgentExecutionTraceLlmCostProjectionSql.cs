namespace ArchLucid.Persistence.Sql;

/// <summary>
///     SQL projection for LLM cost/token aggregation without loading full <c>TraceJson</c> (TB-577 / TB-931).
/// </summary>
internal static class AgentExecutionTraceLlmCostProjectionSql
{
    /// <summary>
    ///     Prefer typed columns (TB-931); <c>JSON_VALUE</c> covers rows written before dual-write / during rolling deploy.
    /// </summary>
    public const string SelectColumns = """
                                          t.ModelDeploymentName,
                                          COALESCE(t.InputTokenCount, TRY_CAST(JSON_VALUE(t.TraceJson, '$.inputTokenCount') AS int)) AS InputTokenCount,
                                          COALESCE(t.OutputTokenCount, TRY_CAST(JSON_VALUE(t.TraceJson, '$.outputTokenCount') AS int)) AS OutputTokenCount,
                                          COALESCE(t.ReasoningTokenCount, TRY_CAST(JSON_VALUE(t.TraceJson, '$.reasoningTokenCount') AS int)) AS ReasoningTokenCount
                                          """;
}
