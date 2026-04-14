using ArchLucid.Persistence.Connections;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Connections;

public sealed class SqlUniqueConstraintViolationDetectorTests
{
    [Theory]
    [InlineData(2601)]
    [InlineData(2627)]
    public void IsUniqueKeyViolation_SqlException_with_duplicate_key_numbers_ReturnsTrue(int errorNumber)
    {
        Exception ex = SqlExceptionTestFactory.Create(errorNumber);

        SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(ex).Should().BeTrue();
    }

    [Fact]
    public void IsUniqueKeyViolation_wrapped_in_invalid_operation_preserves_detection()
    {
        Exception inner = SqlExceptionTestFactory.Create(2627);
        Exception wrapped = new InvalidOperationException("dapper", inner);

        SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(wrapped).Should().BeTrue();
    }

    [Fact]
    public void IsUniqueKeyViolation_transient_deadlock_code_ReturnsFalse()
    {
        Exception ex = SqlExceptionTestFactory.Create(1205);

        SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(ex).Should().BeFalse();
    }
}
