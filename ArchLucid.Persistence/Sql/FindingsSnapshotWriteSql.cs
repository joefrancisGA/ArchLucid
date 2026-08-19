namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Write and backfill SQL for <c>SqlFindingsSnapshotRepository</c>.
/// </summary>
internal static class FindingsSnapshotWriteSql
{
    public const string InsertHeader = """
                                       INSERT INTO dbo.FindingsSnapshots
                                       (
                                           FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId,
                                           TenantId, WorkspaceId, ProjectId,
                                           CreatedUtc, SchemaVersion, GenerationStatus, FindingsJson,
                                           ChecklistCoverageJson, InsightDensityDemotedCount, InsightDensityRetainedCount
                                       )
                                       VALUES
                                       (
                                           @FindingsSnapshotId, @RunId, @ContextSnapshotId, @GraphSnapshotId,
                                           @TenantId, @WorkspaceId, @ProjectId,
                                           @CreatedUtc, @SchemaVersion, @GenerationStatus, @FindingsJson,
                                           @ChecklistCoverageJson, @InsightDensityDemotedCount, @InsightDensityRetainedCount
                                       );
                                       """;

    public const string InsertFindingRecord = """
                                              INSERT INTO dbo.FindingRecords
                                              (
                                                  FindingRecordId, FindingsSnapshotId, SortOrder,
                                                  TenantId, WorkspaceId, ProjectId,
                                                  FindingId, FindingSchemaVersion, FindingType, Category, EngineType,
                                                  Severity, Title, Rationale, PayloadType, PayloadJson,
                                                  RequestInputRef, RunIdRef, AgentExecutionTraceId,
                                                  ModelDeploymentName, ModelVersion, PromptTemplateId, PromptTemplateVersion,
                                                  ConfidenceScore, EvaluationConfidenceScore, EvaluationConfidenceLevel, PolicyRuleId,
                                                  HumanReviewStatus, ReviewedByUserId, ReviewedAtUtc, ReviewNotes,
                                                  IsMuted, MuteReason, ReasoningTrace, ReasoningTraceDigestSha256,
                                                  InsightDensityScore, Treatment, Classification,
                                                  WhyThisIsNotGeneric, PrincipalArchitectValue, DecisionConsequence
                                              )
                                              VALUES
                                              (
                                                  @FindingRecordId, @FindingsSnapshotId, @SortOrder,
                                                  @TenantId, @WorkspaceId, @ProjectId,
                                                  @FindingId, @FindingSchemaVersion, @FindingType, @Category, @EngineType,
                                                  @Severity, @Title, @Rationale, @PayloadType, @PayloadJson,
                                                  @RequestInputRef, @RunIdRef, @AgentExecutionTraceId,
                                                  @ModelDeploymentName, @ModelVersion, @PromptTemplateId, @PromptTemplateVersion,
                                                  @ConfidenceScore, @EvaluationConfidenceScore, @EvaluationConfidenceLevel, @PolicyRuleId,
                                                  @HumanReviewStatus, @ReviewedByUserId, @ReviewedAtUtc, @ReviewNotes,
                                                  @IsMuted, @MuteReason, @ReasoningTrace, @ReasoningTraceDigestSha256,
                                                  @InsightDensityScore, @Treatment, @Classification,
                                                  @WhyThisIsNotGeneric, @PrincipalArchitectValue, @DecisionConsequence
                                              );
                                              """;

    public const string CountFindingRecordsBySnapshotId = """
                                                          SELECT COUNT(1) FROM dbo.FindingRecords
                                                          WHERE FindingsSnapshotId = @FindingsSnapshotId
                                                          """;

    public const string PriorityRankUpdateHeader = """
                                                   UPDATE fr
                                                   SET PriorityRank = v.PriorityRank
                                                   FROM dbo.FindingRecords fr
                                                   INNER JOIN (VALUES
                                                   """;

    public const string PriorityRankUpdateFooter = """
                                                   ) AS v(FindingId, PriorityRank)
                                                     ON fr.FindingsSnapshotId = @FsId AND fr.FindingId = v.FindingId
                                                   """;

    public const string SelectScopeTripleForBackfill = """
                                                       SELECT TenantId, WorkspaceId, ProjectId
                                                       FROM dbo.FindingsSnapshots
                                                       WHERE FindingsSnapshotId = @FindingsSnapshotId;
                                                       """;
}
