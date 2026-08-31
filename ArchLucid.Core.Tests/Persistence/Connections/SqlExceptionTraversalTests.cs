using ArchLucid.Core.Persistence.ApplicationPorts.Connections;
using ArchLucid.Persistence.Connections;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Connections;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlExceptionTraversalTests
{
    [Fact]
    public void TryFind_returns_false_when_exception_is_null()
    {
        bool found = SqlExceptionTraversal.TryFind(null, out SqlErrorSnapshot snapshot);

        found.Should().BeFalse();
        snapshot.Should().Be(default(SqlErrorSnapshot));
    }

    [Fact]
    public void TryFind_reads_sql_exception_on_inner_chain()
    {
        Microsoft.Data.SqlClient.SqlException sqlException = SqlExceptionTestFactory.Create(547);
        Exception wrapped = new Exception("wrapper", sqlException);

        bool found = SqlExceptionTraversal.TryFind(wrapped, out SqlErrorSnapshot snapshot);

        found.Should().BeTrue();
        snapshot.Number.Should().Be(547);
    }

    [Fact]
    public void Find_returns_null_when_no_sql_exception_exists()
    {
        SqlExceptionTraversal.Find(new InvalidOperationException("boom")).Should().BeNull();
    }
}
