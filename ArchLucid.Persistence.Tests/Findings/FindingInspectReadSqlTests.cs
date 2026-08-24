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
        string dispositionSql = ExtractStatementContaining(FindingInspectReadSql.FollowUpBatch, "FROM dbo.FindingReviewEvents");

        dispositionSql.Should().Contain("TenantId = @TenantId");
        dispositionSql.Should().Contain("WorkspaceId = @WorkspaceId");
        dispositionSql.Should().Contain("ProjectId = @ScopeProjectId");
        dispositionSql.Should().Contain("FindingId = @FindingId");
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

    private static string ExtractStatementContaining(string batch, string marker)
    {
        string[] statements = batch.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string? match = statements.FirstOrDefault(s => s.Contains(marker, StringComparison.Ordinal));

        match.Should().NotBeNull($"expected a statement containing '{marker}'");

        return match!;
    }
}
