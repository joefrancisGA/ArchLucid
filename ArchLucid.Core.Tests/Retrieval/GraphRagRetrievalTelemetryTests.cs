using ArchLucid.Core.Retrieval;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Retrieval;

[Trait("Category", "Unit")]
public sealed class GraphRagRetrievalTelemetryTests
{
    [Fact]
    public void CountFromHits_counts_seed_and_neighbor_source_types()
    {
        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit { SourceType = GraphRagRetrievalTelemetry.SeedSourceType, ChunkId = "a" },
            new RetrievalHit { SourceType = GraphRagRetrievalTelemetry.NeighborSourceType, ChunkId = "b" },
            new RetrievalHit { SourceType = GraphRagRetrievalTelemetry.NeighborSourceType, ChunkId = "c" },
        ];

        GraphRagHitCounts counts = GraphRagRetrievalTelemetry.CountFromHits(hits);

        counts.SeedHits.Should().Be(1);
        counts.NeighborsAdded.Should().Be(2);
    }
}
