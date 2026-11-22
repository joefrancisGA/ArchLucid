using System.Reflection;

using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRiskRegisterOrderingTests
{
    [Fact]
    public void List_sql_breaks_disposition_timestamp_ties_using_the_current_disposition_backfill_order()
    {
        MethodInfo? builder = typeof(ArchitectureRiskRegisterReader)
            .GetMethod("BuildListQuerySql", BindingFlags.NonPublic | BindingFlags.Static);
        builder.Should().NotBeNull();

        string? sql = (string?)builder!.Invoke(null, [null, null]);

        sql.Should().Contain("ORDER BY OccurredAtUtc DESC, EventId DESC");
    }
}
