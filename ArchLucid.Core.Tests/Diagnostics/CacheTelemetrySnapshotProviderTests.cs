using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class CacheTelemetrySnapshotProviderTests
{
    [Fact]
    public void GetSnapshot_reflects_graph_projection_enabled_flag()
    {
        CacheTelemetrySnapshotProvider sut = new(() => true);

        CacheTelemetrySnapshot snapshot = sut.GetSnapshot();

        snapshot.GraphProjectionCacheEnabled.Should().BeTrue();
    }

    [Fact]
    public void GetSnapshot_without_reader_leaves_enabled_false()
    {
        CacheTelemetrySnapshotProvider sut = new();

        CacheTelemetrySnapshot snapshot = sut.GetSnapshot();

        snapshot.GraphProjectionCacheEnabled.Should().BeFalse();
    }
}
