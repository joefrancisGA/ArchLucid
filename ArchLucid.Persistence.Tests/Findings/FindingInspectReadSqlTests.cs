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

    private static string ExtractStatementContaining(string batch, string marker)
    {
        string[] statements = batch.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string? match = statements.FirstOrDefault(s => s.Contains(marker, StringComparison.Ordinal));

        match.Should().NotBeNull($"expected a statement containing '{marker}'");

        return match!;
    }
}
