using ArchLucid.Host.Core.Startup;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Startup;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StartupMigrationHealthStateTests
{
    [Fact]
    public void MarkMigrationFailed_sets_flag()
    {
        StartupMigrationHealthState sut = new();

        sut.MigrationFailed.Should().BeFalse();

        sut.MarkMigrationFailed();

        sut.MigrationFailed.Should().BeTrue();
    }
}
