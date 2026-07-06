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
