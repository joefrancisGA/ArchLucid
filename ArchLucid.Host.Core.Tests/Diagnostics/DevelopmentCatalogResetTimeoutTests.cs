using ArchLucid.Persistence.Connections;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class DevelopmentCatalogResetTimeoutTests
{
    [Fact]
    public void ExtendedCommandTimeout_IsTenMinutes()
    {
        SqlCommandTimeouts.ExtendedSeconds.Should().Be(600);
    }
}
