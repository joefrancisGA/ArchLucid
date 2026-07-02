namespace ArchLucid.Persistence.Sql;

/// <summary>
///     SQL projection for LLM cost/token aggregation without loading full <c>TraceJson</c> (TB-577).
/// </summary>
internal static class AgentExecutionTraceLlmCostProjectionSql
{
    /// <summary>
    ///     Token counts via <c>JSON_VALUE</c> on camelCase trace fields; deployment from persisted column.
    /// </summary>
    public const string SelectColumns = """
                                          t.ModelDeploymentName,
                                          TRY_CAST(JSON_VALUE(t.TraceJson, '$.inputTokenCount') AS int) AS InputTokenCount,
                                          TRY_CAST(JSON_VALUE(t.TraceJson, '$.outputTokenCount') AS int) AS OutputTokenCount,
                                          TRY_CAST(JSON_VALUE(t.TraceJson, '$.reasoningTokenCount') AS int) AS ReasoningTokenCount
                                          """;
}
