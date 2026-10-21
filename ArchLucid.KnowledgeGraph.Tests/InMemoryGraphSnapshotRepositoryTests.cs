using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.KnowledgeGraph.Repositories;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     Tests for In Memory Graph Snapshot Repository.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemoryGraphSnapshotRepositoryTests
{
    [Fact]
    public async Task GetLatestByContextSnapshotIdAsync_WhenEmpty_ReturnsNull()
    {
        InMemoryGraphSnapshotRepository sut = new();

        GraphSnapshot? found = await sut.GetLatestByContextSnapshotIdAsync(
            new ScopeContext(),
            Guid.NewGuid(),
            CancellationToken.None);

        found.Should().BeNull();
    }

    [Fact]
    public async Task GetLatestByContextSnapshotIdAsync_ReturnsNewestByCreatedUtc()
    {
        InMemoryGraphSnapshotRepository sut = new();
        Guid contextId = Guid.NewGuid();
        DateTime older = TimeProvider.System.UtcNowDateTime().AddHours(-2);
        DateTime newer = TimeProvider.System.UtcNowDateTime().AddHours(-1);

        GraphSnapshot oldSnap = CreateSnapshot(contextId, older);
        GraphSnapshot newSnap = CreateSnapshot(contextId, newer);
        await sut.SaveAsync(oldSnap, CancellationToken.None);
        await sut.SaveAsync(newSnap, CancellationToken.None);

        GraphSnapshot? found = await sut.GetLatestByContextSnapshotIdAsync(
            new ScopeContext(),
            contextId,
            CancellationToken.None);

        found.Should().NotBeNull();
        found.GraphSnapshotId.Should().Be(newSnap.GraphSnapshotId);
    }

    [Fact]
    public async Task GetLatestByContextSnapshotIdAsync_WhenCreatedUtcEqual_ReturnsMostRecentlySavedSnapshot()
    {
        InMemoryGraphSnapshotRepository sut = new();
        Guid contextId = Guid.NewGuid();
        DateTime sharedCreatedUtc = TimeProvider.System.UtcNowDateTime();

        GraphSnapshot firstSaved = CreateSnapshot(contextId, sharedCreatedUtc);
        firstSaved.GraphSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        GraphSnapshot laterSnapshot = CreateSnapshot(contextId, sharedCreatedUtc);
        laterSnapshot.GraphSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        await sut.SaveAsync(firstSaved, CancellationToken.None);
        await sut.SaveAsync(laterSnapshot, CancellationToken.None);

        GraphSnapshot? found = await sut.GetLatestByContextSnapshotIdAsync(
            new ScopeContext(),
            contextId,
            CancellationToken.None);

        found.Should().NotBeNull();
        found.GraphSnapshotId.Should().Be(laterSnapshot.GraphSnapshotId);
    }

    [Fact]
    public async Task GetLatestByContextSnapshotIdAsync_after_capacity_eviction_retains_newer_snapshot_for_context()
    {
        InMemoryGraphSnapshotRepository sut = new();
        Guid contextId = Guid.NewGuid();
        DateTime newestCreatedUtc = TimeProvider.System.UtcNowDateTime();
        DateTime olderCreatedUtc = newestCreatedUtc.AddDays(-1);

        GraphSnapshot newestForContext = CreateSnapshot(contextId, newestCreatedUtc);
        await sut.SaveAsync(newestForContext, CancellationToken.None);

        for (int i = 0; i < 499; i++)
        {
            GraphSnapshot filler = CreateSnapshot(Guid.NewGuid(), newestCreatedUtc.AddMinutes(-i));
            await sut.SaveAsync(filler, CancellationToken.None);
        }

        GraphSnapshot olderForSameContext = CreateSnapshot(contextId, olderCreatedUtc);
        await sut.SaveAsync(olderForSameContext, CancellationToken.None);

        GraphSnapshot? found = await sut.GetLatestByContextSnapshotIdAsync(
            new ScopeContext(),
            contextId,
            CancellationToken.None);

        found.Should().NotBeNull();
        found!.GraphSnapshotId.Should().Be(newestForContext.GraphSnapshotId);
    }

    [Fact]
    public async Task ListIndexedEdgesAsync_UnknownGraph_ReturnsEmpty()
    {
        InMemoryGraphSnapshotRepository sut = new();

        IReadOnlyList<GraphSnapshotIndexedEdge> edges =
            await sut.ListIndexedEdgesAsync(Guid.NewGuid(), CancellationToken.None);

        edges.Should().BeEmpty();
    }

    [Fact]
    public async Task ListIndexedEdgesAsync_MapsEdgesOrderedByEdgeId()
    {
        InMemoryGraphSnapshotRepository sut = new();
        GraphSnapshot snap = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "b",
                    FromNodeId = "a",
                    ToNodeId = "c",
                    EdgeType = "X",
                    Weight = 2d
                },
                new GraphEdge
                {
                    EdgeId = "a",
                    FromNodeId = "a",
                    ToNodeId = "b",
                    EdgeType = "Y",
                    Weight = 1d
                }
            ]
        };
        await sut.SaveAsync(snap, CancellationToken.None);

        IReadOnlyList<GraphSnapshotIndexedEdge> edges =
            await sut.ListIndexedEdgesAsync(snap.GraphSnapshotId, CancellationToken.None);

        edges.Should().HaveCount(2);
        edges[0].EdgeId.Should().Be("a");
        edges[1].EdgeId.Should().Be("b");
        edges[1].Weight.Should().Be(2d);
    }

    private static GraphSnapshot CreateSnapshot(Guid contextId, DateTime createdUtc)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = contextId,
            RunId = Guid.NewGuid(),
            CreatedUtc = createdUtc,
            Nodes = [],
            Edges = [],
            Warnings = []
        };
    }
}
