namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Operator trace list projection without shipping full <c>TraceJson</c> (TB-929).
///     Nested scalars use <c>JSON_VALUE</c> until typed columns land (<c>TB-931</c>).
/// </summary>
internal static class AgentExecutionTraceListSql
{
    /// <summary>
    ///     Columns for paged summary lists. Must not select bare <c>t.TraceJson</c> (LOB to the app).
    /// </summary>
    public const string SelectSummaryColumns = """
                                               t.TraceId,
                                               t.RunId,
                                               t.TaskId,
                                               t.AgentType,
                                               t.ParseSucceeded,
                                               t.CreatedUtc,
                                               t.ModelDeploymentName,
                                               t.BlobUploadFailed,
                                               TRY_CAST(JSON_VALUE(t.TraceJson, '$.inputTokenCount') AS int) AS InputTokenCount,
                                               TRY_CAST(JSON_VALUE(t.TraceJson, '$.outputTokenCount') AS int) AS OutputTokenCount,
                                               TRY_CAST(JSON_VALUE(t.TraceJson, '$.estimatedCostUsd') AS decimal(18, 6)) AS EstimatedCostUsd,
                                               JSON_VALUE(t.TraceJson, '$.modelAlias') AS ModelAlias,
                                               CAST(ISNULL(TRY_CAST(JSON_VALUE(t.TraceJson, '$.qualityWarning') AS bit), 0) AS bit) AS QualityWarning,
                                               CAST(ISNULL(TRY_CAST(JSON_VALUE(t.TraceJson, '$.qualityRejected') AS bit), 0) AS bit) AS QualityRejected
                                               """;
}
