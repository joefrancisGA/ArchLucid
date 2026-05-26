using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Caching;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotProjectionCacheEntrySizeEstimatorTests
{
    [Fact]
    public void EstimateCacheEntrySize_returns_at_least_minimum_for_empty_snapshot()
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        long size = GraphSnapshotProjectionCacheEntrySizeEstimator.EstimateCacheEntrySize(snapshot);

        size.Should().BeGreaterOrEqualTo(GraphSnapshotProjectionCacheEntrySizeEstimator.MinimumEntrySize);
    }

    [Fact]
    public void EstimateCacheEntrySize_grows_with_node_payload()
    {
        GraphSnapshot empty = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        GraphSnapshot populated = new()
        {
            GraphSnapshotId = empty.GraphSnapshotId,
            RunId = empty.RunId,
            ContextSnapshotId = empty.ContextSnapshotId,
            CreatedUtc = empty.CreatedUtc,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "n1",
                    NodeType = "Service",
                    Label = new string('x', 4096),
                },
            ],
        };

        long emptySize = GraphSnapshotProjectionCacheEntrySizeEstimator.EstimateCacheEntrySize(empty);
        long populatedSize = GraphSnapshotProjectionCacheEntrySizeEstimator.EstimateCacheEntrySize(populated);

        populatedSize.Should().BeGreaterThan(emptySize);
    }
}
