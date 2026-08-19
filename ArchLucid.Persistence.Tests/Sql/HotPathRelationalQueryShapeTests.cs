using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     Guards SQL text for high-volume run/audit list paths â€” deterministic string assertions only (no DB).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HotPathRelationalQueryShapeTests
{
    private static readonly string[] RunListShapeConstants =
    [
        HotPathRelationalQueryShapes.RunsListByProjectNoLock,
        HotPathRelationalQueryShapes.RunsListByProjectKeysetNoLock,
        HotPathRelationalQueryShapes.RunsListRecentInScopeNoLock,
        HotPathRelationalQueryShapes.RunsListRecentInScopeOffsetNoLock,
        HotPathRelationalQueryShapes.RunsListRecentInScopeKeysetNoLock,
    ];

    [SkippableTheory]
    [MemberData(nameof(RunListShapeConstantsMemberData))]
    public void Run_list_shapes_omit_engine_provenance_json(string sql)
    {
        sql.Should().NotContain("EngineProvenanceJson");
        sql.Should().Contain("StructuralExecutionMode");
    }

    [SkippableFact]
    public void Run_list_projection_constant_omits_engine_provenance_json()
    {
        RunListSql.SelectColumnsWithoutEngineProvenanceJson.Should().NotContain("EngineProvenanceJson");
        RunListSql.SelectColumnsWithoutEngineProvenanceJson.Should().Contain("PilotAoaiDeploymentSnapshot");
    }

    [SkippableTheory]
    [MemberData(nameof(RunListShapeConstantsMemberData))]
    public void Run_list_shapes_use_join_aggregates_for_warning_flags_not_correlated_exists(string sql)
    {
        sql.Should().Contain("ISNULL(fsWarn.HasWarnings, 0) AS HasWarnings");
        sql.Should().Contain("ISNULL(govWarn.HasGovernanceWarnings, 0) AS HasGovernanceWarnings");
        sql.Should().Contain(") fsWarn ON fsWarn.RunId = r.RunId");
        sql.Should().Contain(") govWarn ON govWarn.RunId = r.RunId");
        sql.Should().Contain("FROM dbo.Runs r WITH (NOLOCK)");
        sql.Should().Contain("r.RunId, r.TenantId");
        sql.Should().NotContain("\n    RunId, TenantId");
        sql.Should().Contain("GROUP BY fs.RunId");
        sql.Should().Contain("GROUP BY ar.RunId");
        sql.Should().NotContain("CASE WHEN EXISTS (SELECT 1 FROM dbo.FindingsSnapshots");
        sql.Should().NotContain("CASE WHEN EXISTS (SELECT 1 FROM dbo.AlertRecords");
    }

    public static IEnumerable<object[]> RunListShapeConstantsMemberData()
    {
        foreach (string shape in RunListShapeConstants)
            yield return [shape];
    }

    [SkippableFact]
    public void Runs_list_by_project_retains_nolock_scope_archived_filter_and_created_order()
    {
        const string sql = HotPathRelationalQueryShapes.RunsListByProjectNoLock;

        sql.Should().Contain("SELECT TOP (@Take)");
        sql.Should().Contain("FROM dbo.Runs r WITH (NOLOCK)");
        sql.Should().Contain("r.ProjectId = @ProjectSlug");
        sql.Should().Contain("r.ScopeProjectId = TRY_CONVERT(uniqueidentifier, @ProjectSlug)");
        sql.Should().Contain("TenantId = @TenantId");
        sql.Should().Contain("WorkspaceId = @WorkspaceId");
        sql.Should().Contain("ScopeProjectId = @ScopeProjectId");
        sql.Should().Contain("ArchivedUtc IS NULL");
        sql.Should().Contain("ORDER BY r.CreatedUtc DESC");
        sql.Should().Contain("StructuralExecutionMode");
    }

    [SkippableFact]
    public void Runs_list_by_project_keyset_retains_cursor_predicate_and_run_id_tie_break()
    {
        const string sql = HotPathRelationalQueryShapes.RunsListByProjectKeysetNoLock;

        sql.Should().Contain("FROM dbo.Runs r WITH (NOLOCK)");
        sql.Should().Contain("SELECT TOP (@Fetch)");
        sql.Should().Contain("@CursorRunId");
        sql.Should().Contain("@CursorCreatedUtc");
        sql.Should().Contain("r.ProjectId = @ProjectSlug");
        sql.Should().Contain("r.ScopeProjectId = TRY_CONVERT(uniqueidentifier, @ProjectSlug)");
        sql.Should().Contain("ArchivedUtc IS NULL");
        sql.Should().Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [SkippableFact]
    public void Committed_architecture_review_exists_retains_scope_join_and_commit_predicate()
    {
        const string sql = HotPathRelationalQueryShapes.CommittedArchitectureReviewExistsNoLock;

        sql.Should().Contain("CASE WHEN EXISTS");
        sql.Should().Contain("FROM dbo.Runs r WITH (NOLOCK)");
        sql.Should().Contain("dbo.GoldenManifests gm WITH (NOLOCK)");
        sql.Should().Contain("TenantId = @TenantId");
        sql.Should().Contain("WorkspaceId = @WorkspaceId");
        sql.Should().Contain("ScopeProjectId = @ScopeProjectId");
        sql.Should().Contain("LegacyRunStatus = @CommittedStatus");
        sql.Should().Contain("GoldenManifestId IS NOT NULL");
    }

    [SkippableFact]
    public void Runs_list_recent_in_scope_retains_nolock_scope_archived_filter_and_created_order()
    {
        const string sql = HotPathRelationalQueryShapes.RunsListRecentInScopeNoLock;

        sql.Should().Contain("SELECT TOP (@Take)");
        sql.Should().Contain("FROM dbo.Runs r WITH (NOLOCK)");
        sql.Should().Contain("TenantId = @TenantId");
        sql.Should().Contain("WorkspaceId = @WorkspaceId");
        sql.Should().Contain("ScopeProjectId = @ScopeProjectId");
        sql.Should().Contain("ArchivedUtc IS NULL");
        sql.Should().Contain("ORDER BY r.CreatedUtc DESC");
    }

    [SkippableFact]
    public void Runs_list_recent_in_scope_offset_retains_nolock_scope_archived_filter_and_offset_fetch()
    {
        const string sql = HotPathRelationalQueryShapes.RunsListRecentInScopeOffsetNoLock;

        sql.Should().Contain("FROM dbo.Runs r WITH (NOLOCK)");
        sql.Should().Contain("TenantId = @TenantId");
        sql.Should().Contain("WorkspaceId = @WorkspaceId");
        sql.Should().Contain("ScopeProjectId = @ScopeProjectId");
        sql.Should().Contain("ArchivedUtc IS NULL");
        sql.Should().Contain("ORDER BY r.CreatedUtc DESC");
        sql.Should().Contain("OFFSET @Offset ROWS FETCH NEXT @Fetch ROWS ONLY");
    }

    [SkippableFact]
    public void Runs_list_recent_in_scope_keyset_matches_project_keyset_cursor_pattern()
    {
        const string sql = HotPathRelationalQueryShapes.RunsListRecentInScopeKeysetNoLock;

        sql.Should().Contain("FROM dbo.Runs r WITH (NOLOCK)");
        sql.Should().Contain("SELECT TOP (@Fetch)");
        sql.Should().Contain("@CursorRunId");
        sql.Should().Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
        sql.Should().NotContain("ProjectId = @ProjectSlug");
    }

    [SkippableFact]
    public void Audit_get_by_scope_retains_scope_and_stable_occurred_event_order()
    {
        const string sql = HotPathRelationalQueryShapes.AuditEventsGetByScopeNoLock;

        sql.Should().Contain("FROM dbo.AuditEvents WITH (NOLOCK)");
        sql.Should().Contain("SELECT TOP (@Take)");
        sql.Should().Contain("TenantId = @TenantId");
        sql.Should().Contain("WorkspaceId = @WorkspaceId");
        sql.Should().Contain("ProjectId = @ProjectId");
        sql.Should().Contain("ORDER BY OccurredUtc DESC, EventId DESC");
        sql.Should().NotContain("DataJson");
    }

    [SkippableFact]
    public void Audit_filtered_list_shape_omits_data_json_export_shape_includes_it()
    {
        const string listPrefix = HotPathRelationalQueryShapes.AuditEventsFilteredSelectFromWhereScopeNoLock;
        const string exportPrefix = HotPathRelationalQueryShapes.AuditEventsFilteredSelectFromWhereScopeWithDataJsonNoLock;

        listPrefix.Should().NotContain("DataJson");
        exportPrefix.Should().Contain("DataJson");
    }

    [SkippableFact]
    public void Audit_filtered_shape_prefix_suffix_allow_dynamic_and_predicate_between()
    {
        const string prefix = HotPathRelationalQueryShapes.AuditEventsFilteredSelectFromWhereScopeNoLock;
        const string suffix = HotPathRelationalQueryShapes.AuditEventsFilteredOrderByOccurredUtcEventIdDesc;

        prefix.Should().Contain("FROM dbo.AuditEvents WITH (NOLOCK)");
        prefix.Should().Contain("TenantId = @TenantId");
        prefix.Should().Contain("AND ProjectId = @ProjectId");

        suffix.Should().Contain("ORDER BY OccurredUtc DESC, EventId DESC");

        string combined = $"{prefix}\n{suffix.Trim()}";

        combined.Should().MatchRegex(@"(?s)@ProjectId\s+ORDER BY OccurredUtc DESC, EventId DESC");
    }

    [SkippableFact]
    public void Audit_count_shape_prefix_contains_count_star_and_scope_keys()
    {
        const string countShape = HotPathRelationalQueryShapes.AuditEventsFilteredCountFromWhereScopeNoLock;

        countShape.Should().Contain("SELECT COUNT(*)");
        countShape.Should().Contain("FROM dbo.AuditEvents WITH (NOLOCK)");
        countShape.Should().Contain("TenantId = @TenantId");
        countShape.Should().Contain("WorkspaceId = @WorkspaceId");
        countShape.Should().Contain("ProjectId = @ProjectId");
    }

    [SkippableFact]
    public void Trace_list_summary_projection_omits_bare_trace_json_column()
    {
        const string sql = AgentExecutionTraceListSql.SelectSummaryColumns;

        // Typed dual-write columns only (TB-931) — no JSON_VALUE LOB touch on the list path.
        sql.Should().NotMatchRegex(@"(?m)^\s*t\.TraceJson\s*$");
        sql.Should().NotContain("AS TraceJson");
        sql.Should().NotContain("JSON_VALUE");
        sql.Should().Contain("t.InputTokenCount");
        sql.Should().Contain("t.ModelDeploymentName");
        sql.Should().Contain("t.BlobUploadFailed");
        sql.Should().Contain("t.QualityWarning");
        sql.Should().Contain("t.QualityRejected");
    }

    [SkippableFact]
    public void Trace_llm_cost_projection_prefers_typed_token_columns()
    {
        const string sql = AgentExecutionTraceLlmCostProjectionSql.SelectColumns;

        sql.Should().NotContain("AS TraceJson");
        sql.Should().NotMatchRegex(@"(?m)^\s*t\.TraceJson\s*$");
        sql.Should().NotContain("JSON_VALUE");
        sql.Should().Contain("t.ModelDeploymentName");
        sql.Should().Contain("t.InputTokenCount");
        sql.Should().Contain("t.OutputTokenCount");
        sql.Should().Contain("t.ReasoningTokenCount");
    }

    [SkippableFact]
    public void Finding_record_list_projection_omits_payload_json()
    {
        FindingRecordListSql.SelectMetadataColumns.Should().NotContain("PayloadJson");
        FindingRecordListSql.SelectMetadataColumns.Should().Contain("FindingRecordId");
        FindingRecordListSql.SelectMetadataColumns.Should().Contain("Title");
    }

    [SkippableFact]
    public void Comparison_record_list_projection_omits_payload_json()
    {
        ComparisonRecordListSql.SelectColumnsWithoutPayloadJson.Should().NotContain("PayloadJson");
        ComparisonRecordListSql.SelectColumnsWithoutPayloadJson.Should().Contain("ComparisonRecordId");
        ComparisonRecordListSql.SelectColumnsWithoutPayloadJson.Should().Contain("SummaryMarkdown");
        ComparisonRecordRunIdSql.ProjectionRow.Should().Contain("PayloadJson");
    }

    [SkippableFact]
    public void Agent_result_list_shapes_document_intentional_result_json_and_proposal_omit()
    {
        AgentResultListSql.GetByRunIdSelectResultJson.Should().Contain("ResultJson");
        AgentResultListSql.ListEvidenceProposalsSelectColumns.Should().Contain("ProposedEvidenceJson");
        AgentResultListSql.ListEvidenceProposalsSelectColumns.Should().NotContain("ResultJson");
        AgentResultListSql.GetByRunIdSelectRollupProjection.Should().Contain("JSON_QUERY(ar.ResultJson, '$.findings')");
        AgentResultListSql.GetByRunIdSelectRollupProjection.Should().NotContain("SELECT ar.ResultJson");
    }

    [SkippableFact]
    public void Trace_scoped_read_shapes_join_runs_and_scope_predicate()
    {
        AgentExecutionTraceQueryShapes.SelectTraceJsonByRunId.Should().Contain("INNER JOIN dbo.Runs run_scope");
        AgentExecutionTraceQueryShapes.SelectTraceJsonByRunId.Should().Contain("run_scope.TenantId = @TenantId");
        AgentExecutionTraceQueryShapes.SelectTraceJsonByRunId.Should().NotContain("t.TraceJson AS TotalCount");
        AgentExecutionTraceQueryShapes.SelectSummariesPagedByRunId.Should().Contain(AgentExecutionTraceListSql.SelectSummaryColumns.Trim());
        AgentExecutionTraceQueryShapes.SelectSummariesPagedByRunId.Should().Contain("COUNT(*) OVER () AS TotalCount");
    }

    [SkippableFact]
    public void Run_detail_read_shapes_include_warning_flags_and_governance_columns()
    {
        RunRepositorySql.SelectByScopedId.Should().Contain(RunDetailReadSql.SelectCoreColumns.Trim());
        RunRepositorySql.SelectByScopedId.Should().Contain("PackageOrigin");
        RunRepositorySql.SelectByScopedId.Should().Contain(RunDetailReadSql.SelectGovernanceDispositionColumns.Trim());
        RunRepositorySql.SelectByScopedId.Should().Contain("HasWarnings");
        RunRepositorySql.SelectByRunIdAdmin.Should().NotContain("OperatorGovernanceDecision");
    }

    [SkippableFact]
    public void Findings_snapshot_write_shapes_cover_header_and_finding_insert()
    {
        FindingsSnapshotWriteSql.InsertHeader.Should().Contain("INSERT INTO dbo.FindingsSnapshots");
        FindingsSnapshotWriteSql.InsertFindingRecord.Should().Contain("INSERT INTO dbo.FindingRecords");
        FindingsSnapshotWriteSql.InsertFindingRecord.Should().Contain("PayloadJson");
        FindingsSnapshotWriteSql.PriorityRankUpdateHeader.Should().Contain("INNER JOIN (VALUES");
    }
}
