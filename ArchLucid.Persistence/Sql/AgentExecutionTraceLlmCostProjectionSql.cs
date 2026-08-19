namespace ArchLucid.Persistence.Sql;

/// <summary>
///     SQL projection for LLM cost/token aggregation without loading full <c>TraceJson</c> (TB-577 / TB-931).
/// </summary>
internal static class AgentExecutionTraceLlmCostProjectionSql
{
    /// <summary>
    ///     Typed dual-write columns only (TB-931) — no <c>JSON_VALUE</c> LOB touch on the cost path.
    /// </summary>
    public const string SelectColumns = """
                                          t.ModelDeploymentName,
                                          t.InputTokenCount,
                                          t.OutputTokenCount,
                                          t.ReasoningTokenCount
                                          """;
}
