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
}
