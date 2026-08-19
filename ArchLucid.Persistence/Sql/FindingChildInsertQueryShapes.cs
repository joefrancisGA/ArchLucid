namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Stable SQL for finding child-row inserts via table-valued parameters (TB-2164).
/// </summary>
internal static class FindingChildInsertQueryShapes
{
    public const string RelatedNodesInsert = """
                                             INSERT INTO dbo.FindingRelatedNodes (FindingRecordId, SortOrder, NodeId, TenantId, WorkspaceId, ProjectId)
                                             SELECT @FindingRecordId, src.SortOrder, src.NodeId, @TenantId, @WorkspaceId, @ProjectId
                                             FROM @Rows AS src;
                                             """;

    public const string RecommendedActionsInsert = """
                                                   INSERT INTO dbo.FindingRecommendedActions (FindingRecordId, SortOrder, ActionText, TenantId, WorkspaceId, ProjectId)
                                                   SELECT @FindingRecordId, src.SortOrder, src.TextValue, @TenantId, @WorkspaceId, @ProjectId
                                                   FROM @Rows AS src;
                                                   """;

    public const string PropertiesInsert = """
                                           INSERT INTO dbo.FindingProperties (FindingRecordId, PropertySortOrder, PropertyKey, PropertyValue, TenantId, WorkspaceId, ProjectId)
                                           SELECT @FindingRecordId, src.PropertySortOrder, src.PropertyKey, src.PropertyValue, @TenantId, @WorkspaceId, @ProjectId
                                           FROM @Rows AS src;
                                           """;

    public const string TraceGraphNodesExaminedInsert = """
                                                        INSERT INTO dbo.FindingTraceGraphNodesExamined (FindingRecordId, SortOrder, NodeId, TenantId, WorkspaceId, ProjectId)
                                                        SELECT @FindingRecordId, src.SortOrder, src.NodeId, @TenantId, @WorkspaceId, @ProjectId
                                                        FROM @Rows AS src;
                                                        """;

    public const string TraceRulesAppliedInsert = """
                                                  INSERT INTO dbo.FindingTraceRulesApplied (FindingRecordId, SortOrder, RuleText, TenantId, WorkspaceId, ProjectId)
                                                  SELECT @FindingRecordId, src.SortOrder, src.TextValue, @TenantId, @WorkspaceId, @ProjectId
                                                  FROM @Rows AS src;
                                                  """;

    public const string TraceDecisionsTakenInsert = """
                                                    INSERT INTO dbo.FindingTraceDecisionsTaken (FindingRecordId, SortOrder, DecisionText, TenantId, WorkspaceId, ProjectId)
                                                    SELECT @FindingRecordId, src.SortOrder, src.TextValue, @TenantId, @WorkspaceId, @ProjectId
                                                    FROM @Rows AS src;
                                                    """;

    public const string TraceAlternativePathsInsert = """
                                                      INSERT INTO dbo.FindingTraceAlternativePaths (FindingRecordId, SortOrder, PathText, TenantId, WorkspaceId, ProjectId)
                                                      SELECT @FindingRecordId, src.SortOrder, src.TextValue, @TenantId, @WorkspaceId, @ProjectId
                                                      FROM @Rows AS src;
                                                      """;

    public const string TraceNotesInsert = """
                                           INSERT INTO dbo.FindingTraceNotes (FindingRecordId, SortOrder, NoteText, TenantId, WorkspaceId, ProjectId)
                                           SELECT @FindingRecordId, src.SortOrder, src.TextValue, @TenantId, @WorkspaceId, @ProjectId
                                           FROM @Rows AS src;
                                           """;
}
