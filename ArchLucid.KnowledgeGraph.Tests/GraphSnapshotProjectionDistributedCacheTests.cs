using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.KnowledgeGraph.Tests;
[Trait("Category", "Unit")]

/// <summary><see cref="GraphSnapshotProjectionDistributedCache"/> exercises UTF-8 JSON round-trip + eviction.</summary>
public sealed class GraphSnapshotProjectionDistributedCacheTests
{
    [Fact]
    public async Task GetOrLoadAsync_round_trips_through_IDistributedCache_when_enabled()
    {
        ServiceCollection services = new();
        services.AddDistributedMemoryCache();

        KnowledgeGraphProjectionCacheOptions options = new()
        {
            Enabled = true,
            Backend = GraphProjectionCacheBackend.Distributed,
            AbsoluteExpirationSeconds = 600,
        };

        Mock<IOptionsMonitor<KnowledgeGraphProjectionCacheOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);

        services.AddSingleton(monitor.Object);
        services.AddSingleton<GraphSnapshotProjectionDistributedCache>();

        await using ServiceProvider sp = services.BuildServiceProvider();

        GraphSnapshotProjectionDistributedCache sut = sp.GetRequiredService<GraphSnapshotProjectionDistributedCache>();
        ScopeContext scope = CreateScope();
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();

        GraphSnapshot payload = new()
        {
            GraphSnapshotId = graphId,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = runId,
            CreatedUtc = DateTime.UtcNow,
            Nodes = [new GraphNode { NodeId = "n1", NodeType = "t", Label = "L" }],
            Edges = [],
        };

        int[] loads = [0];

        GraphSnapshot? first = await sut.GetOrLoadAsync(
            scope,
            runId,
            graphId,
            _ =>
            {
                loads[0]++;

                return Task.FromResult<GraphSnapshot?>(payload);
            },
            CancellationToken.None);

        loads[0].Should().Be(1);
        first.Should().NotBeNull();

        GraphSnapshot? second = await sut.GetOrLoadAsync(
            scope,
            runId,
            graphId,
            _ =>
            {
                loads[0]++;

                return Task.FromResult<GraphSnapshot?>(payload);
            },
            CancellationToken.None);

        loads[0].Should().Be(1);
        second!.GraphSnapshotId.Should().Be(graphId);

        sut.Invalidate(scope, runId, graphId);

        GraphSnapshot? third = await sut.GetOrLoadAsync(
            scope,
            runId,
            graphId,
            _ =>
            {
                loads[0]++;

                return Task.FromResult<GraphSnapshot?>(payload);
            },
            CancellationToken.None);

        loads[0].Should().Be(2);
        third!.Nodes.Should().HaveCount(1);
    }

    private static ScopeContext CreateScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
    }
}
