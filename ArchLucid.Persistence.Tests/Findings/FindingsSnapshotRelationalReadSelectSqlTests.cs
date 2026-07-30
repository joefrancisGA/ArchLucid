using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsSnapshotRelationalReadSelectSqlTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void BuildFindingRecordsSelectSql_separates_select_list_from_from_clause(bool includeInsightDensityColumns)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        string sql = FindingsSnapshotRelationalRead.BuildFindingRecordsSelectSql(
            scope,
            includeInsightDensityColumns);

        Assert.DoesNotContain("Sha256FROM", sql, StringComparison.Ordinal);
        Assert.DoesNotContain("ConsequenceFROM", sql, StringComparison.Ordinal);
        Assert.Contains("FROM dbo.FindingRecords", sql, StringComparison.Ordinal);
        Assert.Contains("ORDER BY SortOrder", sql, StringComparison.Ordinal);

        int fromIndex = sql.IndexOf("FROM dbo.FindingRecords", StringComparison.Ordinal);
        Assert.True(fromIndex > 0);

        char beforeFrom = sql[fromIndex - 1];
        Assert.True(
            char.IsWhiteSpace(beforeFrom),
            $"Expected whitespace before FROM; got U+{(int)beforeFrom:X4} in SQL:{Environment.NewLine}{sql}");
    }
}
