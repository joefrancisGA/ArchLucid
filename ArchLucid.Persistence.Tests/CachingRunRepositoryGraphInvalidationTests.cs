using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
public sealed class CachingRunRepositoryGraphInvalidationTests
{
    [Fact]
    public async Task ClearGraphSnapshotForArchitecture_invalidates_scoped_run_reads()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid architectureId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid? graphId = Guid.NewGuid();
        RunRecord ReadRun() => new() { RunId = runId, GraphSnapshotId = graphId };

        Mock<IRunRepository> inner = new();
        inner.Setup(repo => repo.GetByIdAsync(scope, runId, CancellationToken.None))
            .ReturnsAsync(ReadRun);
        inner.Setup(repo => repo.ListByProjectAsync(scope, "default", 20, CancellationToken.None))
            .ReturnsAsync(() => new[] { ReadRun() });
        inner.Setup(repo => repo.ClearGraphSnapshotForArchitectureAsync(scope, architectureId, CancellationToken.None))
            .Callback(() => graphId = null)
            .ReturnsAsync(new[] { runId });
        CachingRunRepository cache = new(inner.Object, HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions()));

        (await cache.GetByIdAsync(scope, runId, CancellationToken.None))!.GraphSnapshotId.Should().NotBeNull();
        (await cache.ListByProjectAsync(scope, "default", 20, CancellationToken.None))
            .Should().ContainSingle().Which.GraphSnapshotId.Should().NotBeNull();

        await cache.ClearGraphSnapshotForArchitectureAsync(scope, architectureId, CancellationToken.None);

        (await cache.GetByIdAsync(scope, runId, CancellationToken.None))!.GraphSnapshotId.Should().BeNull();
        (await cache.ListByProjectAsync(scope, "default", 20, CancellationToken.None))
            .Should().ContainSingle().Which.GraphSnapshotId.Should().BeNull();
    }
}
