namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Command SQL for <c>dbo.AgentExecutionTraces</c> (writes and single-row patches).
/// </summary>
internal static class AgentExecutionTraceSql
{
    public const string DeleteSameAttempt = """
                                            DELETE FROM AgentExecutionTraces
                                            WHERE RunId = @RunId AND TaskId = @TaskId AND AgentType = @AgentType
                                              AND AttemptIndex = @AttemptIndex;
                                            """;

    public const string DeleteLaterAttempts = """
                                              DELETE FROM AgentExecutionTraces
                                              WHERE RunId = @RunId AND TaskId = @TaskId AND AgentType = @AgentType
                                                AND AttemptIndex > @AttemptIndex;
                                              """;

    /// <summary>Dual-write TB-931 hot scalars so list/cost paths prefer typed columns over JSON_VALUE alone.</summary>
    public const string Insert = """
                                 INSERT INTO AgentExecutionTraces
                                 (
                                     TraceId,
                                     RunId,
                                     TaskId,
                                     AgentType,
                                     AttemptIndex,
                                     ParseSucceeded,
                                     ErrorMessage,
                                     TraceJson,
                                     CreatedUtc,
                                     FullSystemPromptBlobKey,
                                     FullUserPromptBlobKey,
                                     FullResponseBlobKey,
                                     ModelDeploymentName,
                                     ModelVersion,
                                     SystemPromptContentHash,
                                     InputTokenCount,
                                     OutputTokenCount,
                                     ReasoningTokenCount,
                                     EstimatedCostUsd,
                                     ModelAlias,
                                     QualityWarning,
                                     QualityRejected
                                 )
                                 VALUES
                                 (
                                     @TraceId,
                                     @RunId,
                                     @TaskId,
                                     @AgentType,
                                     @AttemptIndex,
                                     @ParseSucceeded,
                                     @ErrorMessage,
                                     @TraceJson,
                                     @CreatedUtc,
                                     @FullSystemPromptBlobKey,
                                     @FullUserPromptBlobKey,
                                     @FullResponseBlobKey,
                                     @ModelDeploymentName,
                                     @ModelVersion,
                                     @SystemPromptContentHash,
                                     @InputTokenCount,
                                     @OutputTokenCount,
                                     @ReasoningTokenCount,
                                     @EstimatedCostUsd,
                                     @ModelAlias,
                                     @QualityWarning,
                                     @QualityRejected
                                 );
                                 """;

    public const string SelectTraceJsonByTraceId = """
                                                   SELECT TraceJson
                                                   FROM AgentExecutionTraces
                                                   WHERE TraceId = @TraceId;
                                                   """;

    public const string SelectTraceJsonAndRecordedOutcomeByTraceId = """
                                                                     SELECT TraceJson, RecordedQualityGateOutcome
                                                                     FROM AgentExecutionTraces
                                                                     WHERE TraceId = @TraceId;
                                                                     """;

    public const string UpdateBlobStorageFields = """
                                                  UPDATE AgentExecutionTraces
                                                  SET FullSystemPromptBlobKey = @FullSystemPromptBlobKey,
                                                      FullUserPromptBlobKey = @FullUserPromptBlobKey,
                                                      FullResponseBlobKey = @FullResponseBlobKey,
                                                      TraceJson = @TraceJson
                                                  WHERE TraceId = @TraceId;
                                                  """;

    public const string UpdateBlobUploadFailed = """
                                                 UPDATE AgentExecutionTraces
                                                 SET BlobUploadFailed = @BlobUploadFailed
                                                 WHERE TraceId = @TraceId;
                                                 """;

    public const string UpdateInlinePromptFallback = """
                                                     UPDATE AgentExecutionTraces
                                                     SET FullSystemPromptInline = COALESCE(@FullSystemPromptInline, FullSystemPromptInline),
                                                         FullUserPromptInline = COALESCE(@FullUserPromptInline, FullUserPromptInline),
                                                         FullResponseInline = COALESCE(@FullResponseInline, FullResponseInline),
                                                         TraceJson = @TraceJson
                                                     WHERE TraceId = @TraceId;
                                                     """;

    public const string UpdateInlineFallbackFailed = """
                                                     UPDATE AgentExecutionTraces
                                                     SET InlineFallbackFailed = @InlineFallbackFailed,
                                                         TraceJson = @TraceJson
                                                     WHERE TraceId = @TraceId;
                                                     """;

    public const string UpdateQualityWarning = """
                                               UPDATE AgentExecutionTraces
                                               SET TraceJson = @TraceJson,
                                                   QualityWarning = @QualityWarning
                                               WHERE TraceId = @TraceId;
                                               """;

    public const string UpdateQualityRejected = """
                                                UPDATE AgentExecutionTraces
                                                SET TraceJson = @TraceJson,
                                                    QualityRejected = @QualityRejected
                                                WHERE TraceId = @TraceId;
                                                """;

    public const string UpdateQualityGateRecordedSnapshot = """
                                                            UPDATE AgentExecutionTraces
                                                            SET TraceJson = @TraceJson,
                                                                QualityWarning = @QualityWarning,
                                                                QualityRejected = @QualityRejected,
                                                                QualityGateDefinitionVersion = @QualityGateDefinitionVersion,
                                                                QualityGateDefinitionContentHashSha256 = @QualityGateDefinitionContentHashSha256,
                                                                RecordedQualityGateOutcome = @RecordedQualityGateOutcome,
                                                                RecordedStructuralCompletenessRatio = @RecordedStructuralCompletenessRatio,
                                                                RecordedSemanticScore = @RecordedSemanticScore,
                                                                RecordedRejectReasonCategory = @RecordedRejectReasonCategory,
                                                                RecordedTriageScenarioId = @RecordedTriageScenarioId
                                                            WHERE TraceId = @TraceId
                                                              AND RecordedQualityGateOutcome IS NULL;
                                                            """;

    public const string HardDeleteArchivedBefore = """
                                                   DELETE TOP (@Batch)
                                                   FROM dbo.AgentExecutionTraces
                                                   WHERE ArchivedUtc IS NOT NULL
                                                     AND ArchivedUtc < @ArchivedBeforeUtc;
                                                   """;
}
