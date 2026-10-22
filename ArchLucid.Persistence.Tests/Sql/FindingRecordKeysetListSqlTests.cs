using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class FindingRecordKeysetListSqlTests
{
    [Fact]
    public void BuildKeysetPage_orders_by_sort_order_when_priority_ordering_disabled()
    {
        string sql = FindingRecordKeysetListSql.BuildKeysetPage(new ScopeContext(), orderByPriority: false);

        sql.Should().Contain("ORDER BY SortOrder ASC, FindingRecordId ASC;");

        // PriorityRank is still projected as a column; it just must not take part in ordering or the cursor comparison.
        sql.Should().NotContain("COALESCE(PriorityRank");
        sql.Should().NotContain("@CurPr");
    }

    [Fact]
    public void BuildKeysetPage_orders_unranked_findings_last_when_priority_ordering_enabled()
    {
        string sql = FindingRecordKeysetListSql.BuildKeysetPage(new ScopeContext(), orderByPriority: true);

        sql.Should().Contain("ORDER BY COALESCE(PriorityRank, 2147483647) ASC, SortOrder ASC, FindingRecordId ASC;");
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void BuildKeysetPage_always_applies_optional_filters_and_cursor_guard(bool orderByPriority)
    {
        string sql = FindingRecordKeysetListSql.BuildKeysetPage(new ScopeContext(), orderByPriority);

        sql.Should().Contain("@Severity IS NULL OR Severity = @Severity");
        sql.Should().Contain("@Category IS NULL OR Category = @Category");
        sql.Should().Contain("@FindingType IS NULL OR FindingType = @FindingType");
        sql.Should().Contain("@HasCursor = 0");
        sql.Should().Contain("SELECT TOP (@Limit)");
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void BuildKeysetPage_omits_scope_predicate_for_trusted_job_scope(bool orderByPriority)
    {
        string sql = FindingRecordKeysetListSql.BuildKeysetPage(new ScopeContext(), orderByPriority);

        sql.Should().NotContain("@ScopeTenantId");
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void BuildKeysetPage_applies_scope_triple_for_tenant_scoped_reads(bool orderByPriority)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        string sql = FindingRecordKeysetListSql.BuildKeysetPage(scope, orderByPriority);

        sql.Should().Contain("TenantId = @ScopeTenantId");
        sql.Should().Contain("WorkspaceId = @ScopeWorkspaceId");
        sql.Should().Contain("ProjectId = @ScopeProjectId");
    }
}
