using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class RunListWarningFlagSqlTests
{
    [Fact]
    public void SelectColumns_projects_isnull_wrapped_warning_flags()
    {
        RunListWarningFlagSql.SelectColumns.Should().Contain("ISNULL(fsWarn.HasWarnings, 0) AS HasWarnings");
        RunListWarningFlagSql.SelectColumns.Should().Contain("ISNULL(govWarn.HasGovernanceWarnings, 0) AS HasGovernanceWarnings");
    }

    [Fact]
    public void LeftJoinAggregates_groups_findings_and_open_alerts_by_run_id()
    {
        const string joins = RunListWarningFlagSql.LeftJoinAggregates;

        joins.Should().Contain("FROM dbo.FindingsSnapshots fs WITH (NOLOCK)");
        joins.Should().Contain("fs.ArchivedUtc IS NULL");
        joins.Should().Contain("GROUP BY fs.RunId");
        joins.Should().Contain("FROM dbo.AlertRecords ar WITH (NOLOCK)");
        joins.Should().Contain("ar.Status = N'Open'");
        joins.Should().Contain("GROUP BY ar.RunId");
        joins.Should().Contain(") fsWarn ON fsWarn.RunId = r.RunId");
        joins.Should().Contain(") govWarn ON govWarn.RunId = r.RunId");
    }

    [Fact]
    public void LeftJoinAggregates_normalizes_architecture_request_id_before_package_origin_join()
    {
        const string joins = RunListWarningFlagSql.LeftJoinAggregates;

        joins.Should().Contain("STRING_SPLIT(LTRIM(RTRIM(r.ArchitectureRequestId))");
        joins.Should().Contain("STRING_SPLIT(LTRIM(RTRIM(ar.RequestId))");
        joins.Should().Contain("STRING_AGG");
    }

    [Fact]
    public void SelectRunColumns_coalesces_persisted_package_origin_with_request_json_fallback()
    {
        const string columns = RunListWarningFlagSql.SelectRunColumns;

        columns.Should().Contain("COALESCE(");
        columns.Should().Contain("r.PackageOrigin");
        columns.Should().Contain("JSON_VALUE(ar.RequestJson, '$.workflowIntent')");
        columns.Should().Contain("THEN N'Created'");
        columns.Should().Contain("ELSE N'Reviewed'");
    }

    [Fact]
    public void SelectRunColumns_workflow_intent_fallback_uses_case_insensitive_json_compare()
    {
        RunListWarningFlagSql.SelectRunColumns.Should()
            .Contain("UPPER(LTRIM(RTRIM(JSON_VALUE(ar.RequestJson, '$.workflowIntent')))) = N'CREATE-ARCHITECTURE'");
    }

    [Fact]
    public void CreatedUtcDescOrderBy_includes_run_id_tie_break_for_stable_offset_pages()
    {
        RunListWarningFlagSql.CreatedUtcDescOrderBy.Should().Be("ORDER BY r.CreatedUtc DESC, r.RunId DESC");
    }

    [Fact]
    public void Package_origin_json_fallback_targets_camel_case_workflow_intent_from_contract_json()
    {
        string json = JsonSerializer.Serialize(
            new ArchitectureRequest { WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture },
            ContractJson.Default);

        using JsonDocument document = JsonDocument.Parse(json);

        document.RootElement.TryGetProperty("workflowIntent", out JsonElement intent).Should().BeTrue();
        intent.GetString().Should().Be(ArchitectureWorkflowIntent.CreateArchitecture);
        document.RootElement.TryGetProperty("WorkflowIntent", out _).Should().BeFalse(
            "ArchitectureRequests.RequestJson is always written via ContractJson.Default camelCase.");
    }

    [Fact]
    public void KeysetCursorPredicate_includes_run_id_tie_break_for_stable_keyset_pages()
    {
        RunListWarningFlagSql.KeysetCursorPredicate.Should().Contain("r.RunId < @CursorRunId");
        RunListWarningFlagSql.KeysetOrderBy.Should().Be(RunListWarningFlagSql.CreatedUtcDescOrderBy);
    }

    [Fact]
    public void RunsListRecentInScopeNoLock_uses_bounded_top_take()
    {
        HotPathRelationalQueryShapes.RunsListRecentInScopeNoLock.Should().Contain("SELECT TOP (@Take)");
    }

    [Fact]
    public void ScopeWhereTail_excludes_archived_runs_from_dashboard_lists()
    {
        RunListWarningFlagSql.ScopeWhereTail.Should().Contain("r.ArchivedUtc IS NULL");
        RunListWarningFlagSql.ScopeWhereTail.Should().Contain("r.TenantId = @TenantId");
    }

    [Fact]
    public void RunsListRecentInScopeKeysetNoLock_reuses_shared_keyset_cursor_predicate()
    {
        HotPathRelationalQueryShapes.RunsListRecentInScopeKeysetNoLock.Should()
            .Contain(RunListWarningFlagSql.KeysetCursorPredicate.Trim());
        HotPathRelationalQueryShapes.RunsListRecentInScopeKeysetNoLock.Should()
            .Contain(RunListWarningFlagSql.KeysetOrderBy);
    }

    [Fact]
    public void Hot_path_list_shapes_pair_select_run_columns_with_left_join_aggregates()
    {
        HotPathRelationalQueryShapes.RunsListRecentInScopeNoLock.Should()
            .Contain(RunListWarningFlagSql.LeftJoinAggregates.Trim());
        HotPathRelationalQueryShapes.RunsListByProjectNoLock.Should()
            .Contain("JSON_VALUE(ar.RequestJson");
    }
}
