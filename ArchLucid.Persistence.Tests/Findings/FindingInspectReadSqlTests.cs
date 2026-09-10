using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

/// <summary>
///     Shape guards for inspect follow-up SQL — FindingId is not unique within a tenant across workspace/project.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInspectReadSqlTests
{
    [Fact]
    public void FollowUpBatch_scopes_latest_disposition_to_workspace_and_project()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("TenantId = @TenantId");
        dispositionSql.Should().Contain("WorkspaceId = @WorkspaceId");
        dispositionSql.Should().Contain("ProjectId = @ScopeProjectId");
        dispositionSql.Should().Contain("FindingId = @FindingId");
        dispositionSql.Should().Contain("INNER JOIN dbo.FindingReviewEvents");
        dispositionSql.Should().Contain("CurrentEventId = e.EventId");
    }

    [Fact]
    public void FollowUpBatch_disposition_subquery_projects_revisit_due_from_current_pointer_event()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("e.RevisitDueUtc");
    }

    [Fact]
    public void FollowUpBatch_scopes_active_waiver_count_to_workspace_and_project()
    {
        string waiverSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.RiskExceptions");

        waiverSql.Should().Contain("TenantId = @TenantId");
        waiverSql.Should().Contain("WorkspaceId = @WorkspaceId");
        waiverSql.Should().Contain("ProjectId = @ScopeProjectId");
        waiverSql.Should().Contain("FindingId = @FindingId");
    }

    [Fact]
    public void FollowUpBatch_scopes_related_nodes_child_table_to_request_scope()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("frn.TenantId = @TenantId");
        relatedNodesSql.Should().Contain("frn.WorkspaceId = @WorkspaceId");
        relatedNodesSql.Should().Contain("frn.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void FollowUpBatch_scopes_finding_record_row_to_request_tenant()
    {
        // FindingRecords carries TenantId; run-only predicates can still surface a row when fr.TenantId diverges.
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("fr.TenantId = @TenantId");
        relatedNodesSql.Should().Contain("fr.WorkspaceId = @WorkspaceId");
        relatedNodesSql.Should().Contain("fr.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void MainInspect_scopes_finding_record_row_to_request_tenant()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.TenantId = @TenantId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.WorkspaceId = @WorkspaceId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.ProjectId = @ScopeProjectId");

        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("fr.TenantId = @TenantId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("fr.WorkspaceId = @WorkspaceId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("fr.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void FollowUpBatch_scopes_audit_event_to_workspace_and_project()
    {
        string auditSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.AuditEvents");

        auditSql.Should().Contain("ae.TenantId = @TenantId");
        auditSql.Should().Contain("ae.WorkspaceId = @WorkspaceId");
        auditSql.Should().Contain("ae.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void FollowUpBatch_scopes_related_nodes_to_main_inspect_run()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("r.RunId = @RunId");
    }

    [Fact]
    public void FollowUpBatch_scopes_trace_rules_to_main_inspect_run()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("r.RunId = @RunId");
    }

    [Fact]
    public void FollowUpBatch_scopes_recommended_actions_to_main_inspect_run()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("r.RunId = @RunId");
    }

    [Fact]
    public void MainInspect_orders_by_latest_run_when_finding_id_collides()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public void MainInspect_scopes_agent_execution_trace_to_run()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("aet.RunId = r.RunId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("aet.RunId = r.RunId");
    }

    [Fact]
    public void MainInspect_scopes_decisioning_trace_join_to_request_scope()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("dt.TenantId = r.TenantId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("dt.WorkspaceId = r.WorkspaceId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("dt.ProjectId = r.ScopeProjectId");

        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("dt.TenantId = r.TenantId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("dt.WorkspaceId = r.WorkspaceId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("dt.ProjectId = r.ScopeProjectId");
    }

    [Fact]
    public void MainInspect_excludes_archived_runs_from_active_inspect_selection()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("(r.ArchivedUtc IS NULL)");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("(r.ArchivedUtc IS NULL)");
    }

    [Fact]
    public void MainInspectWithoutTypedPayload_omits_payload_json_column()
    {
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("CAST(NULL AS nvarchar(max)) AS PayloadJson");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().NotContain("fr.PayloadJson");
    }

    [Fact]
    public void FollowUpBatch_orders_related_nodes_by_sort_order()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("ORDER BY frn.SortOrder");
    }

    [Fact]
    public void FollowUpBatch_scopes_audit_event_to_main_inspect_run()
    {
        string auditSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.AuditEvents");

        auditSql.Should().Contain("ae.RunId = @RunId");
    }

    [Fact]
    public void FollowUpBatch_orders_trace_rules_by_sort_order()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("ORDER BY tra.SortOrder");
    }

    [Fact]
    public void FollowUpBatch_orders_recommended_actions_by_sort_order()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("ORDER BY fra.SortOrder");
    }

    [Fact]
    public void FollowUpBatch_active_waiver_count_requires_active_non_expired_exceptions()
    {
        string waiverSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.RiskExceptions");

        waiverSql.Should().Contain("Status = @ActiveStatus");
        waiverSql.Should().Contain("ExpiresAtUtc > SYSUTCDATETIME()");
    }

    [Fact]
    public void FollowUpBatch_disposition_subquery_excludes_null_disposition_rows()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("e.Disposition IS NOT NULL");
    }

    [Fact]
    public void MainInspect_uses_top_one_for_deterministic_run_selection()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("SELECT TOP 1");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("SELECT TOP 1");
    }

    [Fact]
    public void FollowUpBatch_trace_rules_subquery_uses_top_one_for_first_rule_text()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("SELECT TOP 1 tra.RuleText");
    }

    [Fact]
    public void FollowUpBatch_audit_event_filters_authority_committed_event_type()
    {
        string auditSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.AuditEvents");

        auditSql.Should().Contain("ae.EventType = @EventType");
    }

    [Fact]
    public void FollowUpBatch_audit_event_orders_by_latest_occurrence()
    {
        string auditSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.AuditEvents");

        auditSql.Should().Contain("ORDER BY ae.OccurredUtc DESC");
    }

    [Fact]
    public void MainInspect_joins_run_through_findings_snapshot()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("INNER JOIN dbo.Runs r ON r.RunId = fs.RunId");
    }

    [Fact]
    public void MainInspect_resolves_model_alias_from_agent_execution_trace_json()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("JSON_VALUE(aet.TraceJson, '$.modelAlias') AS ModelAlias");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("JSON_VALUE(aet.TraceJson, '$.modelAlias') AS ModelAlias");
    }

    [Fact]
    public void MainInspect_filters_by_scoped_finding_id()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.FindingId = @FindingId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("fr.FindingId = @FindingId");
    }

    [Fact]
    public void FollowUpBatch_disposition_subquery_projects_pointer_metadata_fields()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("e.EventId");
        dispositionSql.Should().Contain("e.ReviewerUserId");
        dispositionSql.Should().Contain("c.RowVersionStamp");
    }

    [Fact]
    public void FollowUpBatch_active_waiver_count_uses_count_big()
    {
        string waiverSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.RiskExceptions");

        waiverSql.Should().Contain("SELECT COUNT_BIG(1)");
    }

    [Fact]
    public void FollowUpBatch_audit_event_tiebreaks_on_event_id()
    {
        string auditSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.AuditEvents");

        auditSql.Should().Contain("ae.EventId DESC");
    }

    [Fact]
    public void MainInspect_scopes_agent_execution_trace_to_finding_trace_id()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("aet.TraceId = fr.AgentExecutionTraceId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("aet.TraceId = fr.AgentExecutionTraceId");
    }

    [Fact]
    public void MainInspect_joins_decisioning_trace_on_decision_trace_id()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("dt.DecisionTraceId = r.DecisionTraceId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("dt.DecisionTraceId = r.DecisionTraceId");
    }

    [Fact]
    public void MainInspect_scopes_run_to_scope_project_id()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.ScopeProjectId = @ScopeProjectId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("r.ScopeProjectId = @ScopeProjectId");
    }

    [Fact]
    public void FollowUpBatch_disposition_subquery_projects_occurred_at_utc()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("e.OccurredAtUtc");
    }

    [Fact]
    public void MainInspect_projects_golden_manifest_id()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.GoldenManifestId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("r.GoldenManifestId");
    }

    [Fact]
    public void MainInspect_projects_run_structural_execution_mode_fields()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.StructuralExecutionMode");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.RealModeFellBackToSimulator");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("r.StructuralExecutionMode");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("r.RealModeFellBackToSimulator");
    }

    [Fact]
    public void MainInspectWithTypedPayload_selects_payload_json_column()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.PayloadJson");
    }

    [Fact]
    public void FollowUpBatch_scopes_trace_rules_child_table_to_request_scope()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("tra.TenantId = @TenantId");
        traceRulesSql.Should().Contain("tra.WorkspaceId = @WorkspaceId");
        traceRulesSql.Should().Contain("tra.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void FollowUpBatch_scopes_recommended_actions_child_table_to_request_scope()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("fra.TenantId = @TenantId");
        actionsSql.Should().Contain("fra.WorkspaceId = @WorkspaceId");
        actionsSql.Should().Contain("fra.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void MainInspect_projects_finding_severity_title_and_rationale()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.Severity");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.Title");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.Rationale");
    }

    [Fact]
    public void MainInspect_projects_reasoning_trace_fields()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.ReasoningTrace");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.ReasoningTraceDigestSha256");
    }

    [Fact]
    public void MainInspect_projects_applied_rule_ids_json_from_decisioning_trace()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("dt.AppliedRuleIdsJson");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("dt.AppliedRuleIdsJson");
    }

    [Fact]
    public void MainInspect_projects_run_id_and_manifest_version()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.RunId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.CurrentManifestVersion");
    }

    [Fact]
    public void MainInspect_projects_confidence_review_and_mute_fields()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.ConfidenceScore");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.EvaluationConfidenceScore");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.EvaluationConfidenceLevel");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.HumanReviewStatus");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.IsMuted");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.MuteReason");
    }

    [Fact]
    public void MainInspect_projects_assignment_and_remediation_fields()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.AssignedToUserId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.RemediationDueUtc");
    }

    [Fact]
    public void FollowUpBatch_related_nodes_selects_node_id()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("SELECT frn.NodeId");
    }

    [Fact]
    public void FollowUpBatch_audit_event_selects_event_id()
    {
        string auditSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.AuditEvents");

        auditSql.Should().Contain("SELECT TOP 1 ae.EventId");
    }

    [Fact]
    public void MainInspect_projects_model_deployment_and_prompt_template_version()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.ModelDeploymentName");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.PromptTemplateVersion");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("fr.ModelDeploymentName");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("fr.PromptTemplateVersion");
    }

    [Fact]
    public void MainInspectWithoutTypedPayload_joins_run_through_findings_snapshot()
    {
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("INNER JOIN dbo.Runs r ON r.RunId = fs.RunId");
    }

    [Fact]
    public void MainInspect_selects_finding_id_column()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("fr.FindingId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("fr.FindingId");
    }

    [Fact]
    public void FollowUpBatch_recommended_actions_selects_action_text()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("SELECT fra.ActionText");
    }

    [Fact]
    public void FollowUpBatch_trace_rules_selects_rule_text()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("SELECT TOP 1 tra.RuleText");
    }

    [Fact]
    public void FollowUpBatch_waiver_count_filters_by_finding_id()
    {
        string waiverSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.RiskExceptions");

        waiverSql.Should().Contain("FindingId = @FindingId");
    }

    [Fact]
    public void MainInspect_uses_left_join_for_agent_execution_traces()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("LEFT JOIN dbo.AgentExecutionTraces aet");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("LEFT JOIN dbo.AgentExecutionTraces aet");
    }

    [Fact]
    public void MainInspect_uses_left_join_for_decisioning_traces()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("LEFT JOIN dbo.DecisioningTraces dt");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("LEFT JOIN dbo.DecisioningTraces dt");
    }

    [Fact]
    public void FollowUpBatch_related_nodes_joins_finding_record_by_id()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("INNER JOIN dbo.FindingRecords fr ON fr.FindingRecordId = frn.FindingRecordId");
    }

    [Fact]
    public void FollowUpBatch_trace_rules_filters_by_finding_id()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("fr.FindingId = @FindingId");
    }

    [Fact]
    public void FollowUpBatch_recommended_actions_filters_by_finding_id()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("fr.FindingId = @FindingId");
    }

    [Fact]
    public void FollowUpBatch_disposition_joins_review_events_on_pointer_columns()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("c.TenantId = e.TenantId");
        dispositionSql.Should().Contain("c.WorkspaceId = e.WorkspaceId");
        dispositionSql.Should().Contain("c.ProjectId = e.ProjectId");
        dispositionSql.Should().Contain("c.FindingId = e.FindingId");
        dispositionSql.Should().Contain("c.CurrentEventId = e.EventId");
    }

    [Fact]
    public void FollowUpBatch_trace_rules_joins_finding_record_by_id()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("INNER JOIN dbo.FindingRecords fr ON fr.FindingRecordId = tra.FindingRecordId");
    }

    [Fact]
    public void FollowUpBatch_recommended_actions_joins_finding_record_by_id()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("INNER JOIN dbo.FindingRecords fr ON fr.FindingRecordId = fra.FindingRecordId");
    }

    [Fact]
    public void FollowUpBatch_disposition_subquery_uses_top_one()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("SELECT TOP 1 e.Disposition");
    }

    [Fact]
    public void MainInspect_queries_finding_records_table()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("FROM dbo.FindingRecords fr");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("FROM dbo.FindingRecords fr");
    }

    [Fact]
    public void FollowUpBatch_related_nodes_filters_by_finding_id()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("fr.FindingId = @FindingId");
    }

    [Fact]
    public void FollowUpBatch_trace_rules_joins_findings_snapshot()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId");
    }

    [Fact]
    public void FollowUpBatch_recommended_actions_joins_findings_snapshot()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId");
    }

    [Fact]
    public void FollowUpBatch_related_nodes_joins_findings_snapshot()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId");
    }

    [Fact]
    public void FollowUpBatch_related_nodes_joins_runs_table()
    {
        string relatedNodesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRelatedNodes");

        relatedNodesSql.Should().Contain("INNER JOIN dbo.Runs r ON r.RunId = fs.RunId");
    }

    [Fact]
    public void MainInspect_inner_joins_runs_table()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("INNER JOIN dbo.Runs r ON r.RunId = fs.RunId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("INNER JOIN dbo.Runs r ON r.RunId = fs.RunId");
    }

    [Fact]
    public void FollowUpBatch_trace_rules_joins_runs_table()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("INNER JOIN dbo.Runs r ON r.RunId = fs.RunId");
    }

    [Fact]
    public void FollowUpBatch_recommended_actions_joins_runs_table()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("INNER JOIN dbo.Runs r ON r.RunId = fs.RunId");
    }

    [Fact]
    public void FollowUpBatch_trace_rules_scopes_run_to_scope_project_id()
    {
        string traceRulesSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingTraceRulesApplied");

        traceRulesSql.Should().Contain("r.ScopeProjectId = @ScopeProjectId");
    }

    [Fact]
    public void FollowUpBatch_recommended_actions_scopes_run_to_scope_project_id()
    {
        string actionsSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingRecommendedActions");

        actionsSql.Should().Contain("r.ScopeProjectId = @ScopeProjectId");
    }

    [Fact]
    public void FollowUpBatch_audit_event_scoped_by_run_without_finding_records_join()
    {
        string auditSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.AuditEvents");

        auditSql.Should().Contain("ae.RunId = @RunId");
        auditSql.Should().NotContain("FindingRecords");
    }

    [Fact]
    public void FollowUpBatch_disposition_pointer_where_clause_filters_by_scoped_finding_id()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("c.FindingId = @FindingId");
    }

    [Fact]
    public void FollowUpBatch_disposition_pointer_where_clause_filters_by_scoped_tenant_workspace_and_project()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("c.TenantId = @TenantId");
        dispositionSql.Should().Contain("c.WorkspaceId = @WorkspaceId");
        dispositionSql.Should().Contain("c.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void MainInspect_scopes_runs_table_to_tenant_and_workspace()
    {
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.TenantId = @TenantId");
        FindingInspectReadSql.MainInspectWithTypedPayload.Should().Contain("r.WorkspaceId = @WorkspaceId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("r.TenantId = @TenantId");
        FindingInspectReadSql.MainInspectWithoutTypedPayload.Should().Contain("r.WorkspaceId = @WorkspaceId");
    }

    [Fact]
    public void FollowUpBatch_disposition_subquery_selects_disposition_column()
    {
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingCurrentDispositions");

        dispositionSql.Should().Contain("SELECT TOP 1 e.Disposition");
        dispositionSql.Should().Contain("e.OccurredAtUtc");
        dispositionSql.Should().Contain("e.RevisitDueUtc");
    }

    private static string ExtractStatementContaining(string batch, string marker)
    {
        string[] statements = batch.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string? match = statements.FirstOrDefault(s => s.Contains(marker, StringComparison.Ordinal));

        match.Should().NotBeNull($"expected a statement containing '{marker}'");

        return match!;
    }
}
