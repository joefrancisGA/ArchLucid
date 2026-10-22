using ArchLucid.Persistence.Connections;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Connections;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlExceptionErrorMetadataTests
{
    [Fact]
    public void TryRead_returns_false_when_exception_is_null()
    {
        bool found = SqlExceptionErrorMetadata.TryRead(null, out SqlExceptionErrorMetadata metadata);

        found.Should().BeFalse();
        metadata.Should().Be(default(SqlExceptionErrorMetadata));
    }

    [Fact]
    public void TryRead_reads_sql_exception_on_inner_chain()
    {
        Microsoft.Data.SqlClient.SqlException sqlException = SqlExceptionTestFactory.Create(547);
        Exception wrapped = new Exception("wrapper", sqlException);

        bool found = SqlExceptionErrorMetadata.TryRead(wrapped, out SqlExceptionErrorMetadata metadata);

        found.Should().BeTrue();
        metadata.Number.Should().Be(547);
    }

    [Fact]
    public void TryRead_returns_false_when_no_sql_exception_exists()
    {
        bool found = SqlExceptionErrorMetadata.TryRead(new InvalidOperationException("boom"), out _);

        found.Should().BeFalse();
    }
}
