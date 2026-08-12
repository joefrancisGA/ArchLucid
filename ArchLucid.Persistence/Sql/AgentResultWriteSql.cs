namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Write SQL for <c>dbo.AgentResults</c>. Single-row insert, chunked batch insert, and replace all share one column
///     list so a new column cannot be added to one path and forgotten on the others.
/// </summary>
internal static class AgentResultWriteSql
{
    /// <summary>Insert prologue through <c>VALUES</c>; chunked batches append their own row tuples.</summary>
    public const string InsertHeader = """
                                       INSERT INTO AgentResults
                                       (
                                           ResultId,
                                           TaskId,
                                           RunId,
                                           AgentType,
                                           Confidence,
                                           CalibratedConfidence,
                                           ProposedEvidenceJson,
                                           PromptVariantKey,
                                           TaskStructuralExecutionMode,
                                           CacheServed,
                                           ResultJson,
                                           CreatedUtc
                                       )
                                       VALUES
                                       """;

    /// <summary>Single-row insert; duplicate <c>(RunId, TaskId)</c> is rejected by the TB-201 unique index.</summary>
    public const string Insert = InsertHeader + "\n" + """
                                                      (
                                                          @ResultId,
                                                          @TaskId,
                                                          @RunId,
                                                          @AgentType,
                                                          @Confidence,
                                                          @CalibratedConfidence,
                                                          @ProposedEvidenceJson,
                                                          @PromptVariantKey,
                                                          @TaskStructuralExecutionMode,
                                                          @CacheServed,
                                                          @ResultJson,
                                                          @CreatedUtc
                                                      );
                                                      """;

    public const string DeleteByRunTask = """
                                          DELETE FROM AgentResults
                                          WHERE RunId = @RunId AND TaskId = @TaskId;
                                          """;
}
