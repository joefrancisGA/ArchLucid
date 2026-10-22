namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Operator trace list projection without shipping full <c>TraceJson</c> (TB-929 / TB-931).
///     Uses typed dual-write columns only — no <c>JSON_VALUE</c> LOB touch on the list path.
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
                                               t.InputTokenCount,
                                               t.OutputTokenCount,
                                               t.EstimatedCostUsd,
                                               t.ModelAlias,
                                               t.QualityWarning,
                                               t.QualityRejected
                                               """;
}
