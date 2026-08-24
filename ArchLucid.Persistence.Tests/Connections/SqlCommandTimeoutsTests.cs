using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Category", "Unit")]
public sealed class SqlCommandTimeoutsTests
{
    [Fact]
    public void ExtendedSeconds_IsTenMinutes()
    {
        SqlCommandTimeouts.ExtendedSeconds.Should().Be(600);
        TimeSpan.FromSeconds(SqlCommandTimeouts.ExtendedSeconds).Should().Be(TimeSpan.FromMinutes(10));
    }
}
