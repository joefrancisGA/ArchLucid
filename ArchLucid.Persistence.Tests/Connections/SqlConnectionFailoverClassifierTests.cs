using ArchLucid.Persistence.Connections;

using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlConnectionFailoverClassifierTests
{
    [Theory]
    [InlineData(-2)]
    [InlineData(40613)]
    [InlineData(40197)]
    [InlineData(40501)]
    [InlineData(49918)]
    [InlineData(49919)]
    [InlineData(49920)]
    public void IsFailoverEligible_returns_true_for_known_sql_error_numbers(int errorNumber)
    {
        SqlException exception = SqlExceptionTestFactory.Create(errorNumber);

        SqlConnectionFailoverClassifier.IsFailoverEligible(exception).Should().BeTrue();
    }

    [Fact]
    public void IsFailoverEligible_returns_true_for_timeout_exception()
    {
        SqlConnectionFailoverClassifier.IsFailoverEligible(new TimeoutException()).Should().BeTrue();
    }

    [Fact]
    public void IsFailoverEligible_returns_false_for_unrelated_sql_error()
    {
        SqlException exception = SqlExceptionTestFactory.Create(547);

        SqlConnectionFailoverClassifier.IsFailoverEligible(exception).Should().BeFalse();
    }

    [Fact]
    public void IsFailoverEligible_returns_false_for_non_sql_exception()
    {
        SqlConnectionFailoverClassifier.IsFailoverEligible(new InvalidOperationException()).Should().BeFalse();
    }
}
