using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Repositories;
[Trait("Category", "Unit")]

public sealed class InMemoryRunRepositoryGetLatestWithGraphAtOrBeforeTests
{
    [Fact]
    public async Task GetLatestWithGraphAtOrBefore_skips_runs_without_graph_and_picks_newest_on_or_before_boundary()
    {
        IRunRepository repo = new InMemoryRunRepository(new InMemoryTenantRepository());
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        DateTime t0 = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime t1 = new(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime t2 = new(2025, 12, 1, 0, 0, 0, DateTimeKind.Utc);

        RunRecord noGraph = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p-a",
            CreatedUtc = t0
        };

        RunRecord olderGraph = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p-a",
            CreatedUtc = t1,
            GraphSnapshotId = Guid.NewGuid()
        };

        RunRecord newerGraph = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p-a",
            CreatedUtc = t2,
            GraphSnapshotId = Guid.NewGuid()
        };

        await repo.SaveAsync(noGraph, CancellationToken.None);
        await repo.SaveAsync(olderGraph, CancellationToken.None);
        await repo.SaveAsync(newerGraph, CancellationToken.None);

        RunRecord? atMid =
            await repo.GetLatestWithGraphAtOrBeforeAsync(scope, "p-a", t1.AddDays(15), CancellationToken.None);

        atMid.Should().NotBeNull();
        atMid!.RunId.Should().Be(olderGraph.RunId);

        RunRecord? atEnd =
            await repo.GetLatestWithGraphAtOrBeforeAsync(scope, "p-a", t2.AddDays(1), CancellationToken.None);

        atEnd.Should().NotBeNull();
        atEnd!.RunId.Should().Be(newerGraph.RunId);
    }

    [Fact]
    public async Task GetLatestWithGraphAtOrBefore_returns_null_when_no_qualifying_runs()
    {
        IRunRepository repo = new InMemoryRunRepository(new InMemoryTenantRepository());
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        RunRecord onlyFuture = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "p-x",
            CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            GraphSnapshotId = Guid.NewGuid()
        };

        await repo.SaveAsync(onlyFuture, CancellationToken.None);

        RunRecord? found = await repo.GetLatestWithGraphAtOrBeforeAsync(
            scope,
            "p-x",
            new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            CancellationToken.None);

        found.Should().BeNull();
    }
}
