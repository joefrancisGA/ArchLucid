using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class CachingRunRepositoryPassthroughTests
{
    [Fact]
    public async Task GetByRunIdAdminAsync_delegates_to_inner_without_cache()
    {
        Guid runId = Guid.NewGuid();
        RunRecord run = new() { RunId = runId, TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ScopeProjectId = Guid.NewGuid(), ProjectId = "default" };

        Mock<IRunRepository> inner = new();
        inner.Setup(r => r.GetByRunIdAdminAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(run);

        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions());
        CachingRunRepository sut = new(inner.Object, hotPath);

        RunRecord? result = await sut.GetByRunIdAdminAsync(runId, CancellationToken.None);

        result.Should().BeSameAs(run);
        inner.Verify(r => r.GetByRunIdAdminAsync(runId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListByProjectKeysetAsync_with_cursor_bypasses_cache()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime cursorUtc = TimeProvider.System.UtcNowDateTime();
        Guid cursorRunId = Guid.NewGuid();
        RunListPage expected = new([], false);

        Mock<IRunRepository> inner = new();
        inner.Setup(r => r.ListByProjectKeysetAsync(
                scope,
                "default",
                cursorUtc,
                cursorRunId,
                25,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions());
        CachingRunRepository sut = new(inner.Object, hotPath);

        RunListPage page = await sut.ListByProjectKeysetAsync(
            scope,
            "default",
            cursorUtc,
            cursorRunId,
            25,
            CancellationToken.None);

        page.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task TrySetOperatorGovernanceDispositionAsync_finishes_cache_invalidation_after_write()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid runId = Guid.NewGuid();
        DateTime occurredUtc = TimeProvider.System.UtcNowDateTime();
        using CancellationTokenSource caller = new();
        Mock<IRunRepository> inner = new(MockBehavior.Strict);
        inner.Setup(r => r.TrySetOperatorGovernanceDispositionAsync(
                scope, runId, "Approved", null, "actor", occurredUtc, caller.Token))
            .Callback(caller.Cancel)
            .ReturnsAsync(true);

        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        cache.Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken ct) =>
                ct.IsCancellationRequested ? Task.FromCanceled(ct) : Task.CompletedTask);
        string revisionKey = HotPathCacheKeys.RunListScopeRevision(scope);
        cache.Setup(c => c.GetOrCreateAsync(
                revisionKey,
                It.IsAny<Func<CancellationToken, Task<RunListScopeRevisionState?>>>(),
                CancellationToken.None,
                null))
            .ReturnsAsync(new RunListScopeRevisionState { Revision = 1 });
        CachingRunRepository sut = new(inner.Object, cache.Object);

        bool updated = await sut.TrySetOperatorGovernanceDispositionAsync(
            scope, runId, "Approved", null, "actor", occurredUtc, caller.Token);

        updated.Should().BeTrue();
        cache.Verify(c => c.RemoveAsync(HotPathCacheKeys.Run(scope, runId), CancellationToken.None), Times.Once);
        cache.Verify(c => c.RemoveAsync(revisionKey, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task TrySetOperatorGovernanceDispositionAsync_when_inner_false_does_not_invalidate_cache()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid runId = Guid.NewGuid();

        Mock<IRunRepository> inner = new();
        inner.Setup(r => r.TrySetOperatorGovernanceDispositionAsync(
                scope,
                runId,
                "accept",
                null,
                "actor",
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions());
        CachingRunRepository sut = new(inner.Object, hotPath);

        bool updated = await sut.TrySetOperatorGovernanceDispositionAsync(
            scope,
            runId,
            "accept",
            null,
            "actor",
            TimeProvider.System.UtcNowDateTime(),
            CancellationToken.None);

        updated.Should().BeFalse();
    }
}
