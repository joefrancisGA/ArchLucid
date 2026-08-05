namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Operator trace list projection without shipping full <c>TraceJson</c> (TB-929 / TB-931).
///     Prefer typed dual-write columns; <c>JSON_VALUE</c> covers pre-dual-write / rolling-deploy rows.
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
                                               COALESCE(t.InputTokenCount, TRY_CAST(JSON_VALUE(t.TraceJson, '$.inputTokenCount') AS int)) AS InputTokenCount,
                                               COALESCE(t.OutputTokenCount, TRY_CAST(JSON_VALUE(t.TraceJson, '$.outputTokenCount') AS int)) AS OutputTokenCount,
                                               COALESCE(t.EstimatedCostUsd, TRY_CAST(JSON_VALUE(t.TraceJson, '$.estimatedCostUsd') AS decimal(18, 6))) AS EstimatedCostUsd,
                                               COALESCE(t.ModelAlias, JSON_VALUE(t.TraceJson, '$.modelAlias')) AS ModelAlias,
                                               CAST(CASE
                                                   WHEN t.QualityWarning = 1
                                                        OR TRY_CAST(JSON_VALUE(t.TraceJson, '$.qualityWarning') AS bit) = 1
                                                   THEN 1 ELSE 0 END AS bit) AS QualityWarning,
                                               CAST(CASE
                                                   WHEN t.QualityRejected = 1
                                                        OR TRY_CAST(JSON_VALUE(t.TraceJson, '$.qualityRejected') AS bit) = 1
                                                   THEN 1 ELSE 0 END AS bit) AS QualityRejected
                                               """;
}
