using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotStatementFactoryTests
{
    private static readonly ScopeContext TenantScope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public void BuildSelectHeaderById_reads_the_snapshot_header_for_one_id()
    {
        string sql = FindingsSnapshotStatementFactory.BuildSelectHeaderById(TenantScope);

        sql.Should().StartWith("SELECT");
        sql.Should().Contain("FROM dbo.FindingsSnapshots");
        sql.Should().Contain("WHERE FindingsSnapshotId = @FindingsSnapshotId");
        sql.Should().Contain("TenantId = @ScopeTenantId");
        sql.Should().EndWith(";");
    }

    /// <summary>
    ///     Coverage reads must project engine failures out of <c>FindingsJson</c> with <c>JSON_QUERY</c> rather than
    ///     shipping the whole LOB column to the app.
    /// </summary>
    [Fact]
    public void BuildSelectCoverageHeaderById_projects_engine_failures_without_the_findings_json_column()
    {
        string sql = FindingsSnapshotStatementFactory.BuildSelectCoverageHeaderById(TenantScope);

        sql.Should().Contain("JSON_QUERY(FindingsJson, '$.engineFailures') AS EngineFailuresJson");
        sql.Should().NotContain("GenerationStatus, FindingsJson");
        sql.Should().EndWith(";");
    }

    [Fact]
    public void BuildSelectCoverageFindingMetadata_orders_by_stable_sort_order()
    {
        string sql = FindingsSnapshotStatementFactory.BuildSelectCoverageFindingMetadata(TenantScope);

        sql.Should().Contain("FROM dbo.FindingRecords");
        sql.Should().Contain("ORDER BY SortOrder ASC;");
        sql.Should().NotContain("PayloadJson");
    }

    [Fact]
    public void BuildCountFindingRecords_appends_the_scope_predicate_to_the_shared_count()
    {
        string sql = FindingsSnapshotStatementFactory.BuildCountFindingRecords(TenantScope);

        sql.Should().StartWith(FindingsSnapshotWriteSql.CountFindingRecordsBySnapshotId);
        sql.Should().EndWith("ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void BuildCountFindingRecords_returns_the_unscoped_count_for_trusted_jobs()
    {
        string sql = FindingsSnapshotStatementFactory.BuildCountFindingRecords(new ScopeContext());

        sql.Should().Be(FindingsSnapshotWriteSql.CountFindingRecordsBySnapshotId);
    }

    [Fact]
    public void BuildPriorityRankScopeFilter_aliases_columns_for_the_update_join()
    {
        FindingsSnapshotStatementFactory.BuildPriorityRankScopeFilter(TenantScope)
            .Should()
            .Be(
                " AND fr.TenantId = @ScopeTenantId AND fr.WorkspaceId = @ScopeWorkspaceId AND fr.ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void BuildPriorityRankScopeFilter_is_empty_for_trusted_job_scope()
    {
        FindingsSnapshotStatementFactory.BuildPriorityRankScopeFilter(new ScopeContext()).Should().BeEmpty();
    }
}
