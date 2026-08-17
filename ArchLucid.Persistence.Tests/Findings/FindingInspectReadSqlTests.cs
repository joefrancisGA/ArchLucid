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

    private static string ExtractStatementContaining(string batch, string marker)
    {
        string[] statements = batch.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string? match = statements.FirstOrDefault(s => s.Contains(marker, StringComparison.Ordinal));

        match.Should().NotBeNull($"expected a statement containing '{marker}'");

        return match!;
    }
}
