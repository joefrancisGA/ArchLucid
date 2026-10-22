using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Persistence.CustomerSuccess;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.CustomerSuccess;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryOperatorStickinessSnapshotReaderTests
{
    [Fact]
    public async Task GetOperatorSignalsAsync_returns_zeroed_defaults()
    {
        InMemoryOperatorStickinessSnapshotReader sut = new();

        OperatorStickinessSignals signals = await sut.GetOperatorSignalsAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            CancellationToken.None);

        signals.TotalRunsInScope.Should().Be(0);
        signals.CommittedRunsInScope.Should().Be(0);
        signals.LatestRunId.Should().BeNull();
    }

    [Fact]
    public async Task GetFunnelSnapshotAsync_returns_empty_snapshot()
    {
        InMemoryOperatorStickinessSnapshotReader sut = new();

        PilotFunnelSnapshot snapshot = await sut.GetFunnelSnapshotAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            CancellationToken.None);

        snapshot.FirstRunCreatedUtc.Should().BeNull();
        snapshot.FirstGoldenManifestUtc.Should().BeNull();
        snapshot.TotalRunsInScope.Should().Be(0);
        snapshot.ProductLearningSignalsLast90Days.Should().Be(0);
    }
}
