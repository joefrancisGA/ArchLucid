using ArchLucid.Persistence.CustomerSuccess;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.CustomerSuccess;

[Trait("Suite", "Persistence")]
[Trait("Category", "Unit")]
public sealed class SqlOperatorStickinessSnapshotReaderTests
{
    [Fact]
    public void ToNullableUtcDateTime_ReturnsNull_WhenDbNull()
    {
        DateTime? result = SqlOperatorStickinessSnapshotReader.ToNullableUtcDateTimeForTests(DBNull.Value);

        result.Should().BeNull();
    }
}
