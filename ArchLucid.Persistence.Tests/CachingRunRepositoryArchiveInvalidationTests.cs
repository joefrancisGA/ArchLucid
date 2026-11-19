using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Moq;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Ensures bulk archival evicts hot-path run cache entries so run lookups do not return archived rows until TTL
///     expiry.
/// </summary>
[Trait("Suite", "Core")]
public sealed class CachingRunRepositoryArchiveInvalidationTests
{
    [SkippableFact]
    public async Task ArchiveRunsCreatedBeforeAsync_removes_cached_GetById_row()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryRunRepository inner = new();
        CachingRunRepository repo = new(inner, hotPath);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        RunRecord run = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            CreatedUtc = TimeProvider.System.UtcNowDateTime().AddDays(-10)
        };

        await inner.SaveAsync(run, CancellationToken.None);

        RunRecord? beforeArchive = await repo.GetByIdAsync(scope, run.RunId, CancellationToken.None);

        beforeArchive.Should().NotBeNull();

        RunArchiveBatchResult batch =
            await repo.ArchiveRunsCreatedBeforeAsync(TimeProvider.System.GetUtcNow().AddDays(-1), CancellationToken.None);

        batch.UpdatedCount.Should().Be(1);

        RunRecord? afterArchive = await repo.GetByIdAsync(scope, run.RunId, CancellationToken.None);

        afterArchive.Should().BeNull();
    }

    [SkippableFact]
    public async Task ArchiveRunsCreatedBeforeAsync_evicts_after_the_caller_cancels()
    {
        using CancellationTokenSource caller = new();
        DateTimeOffset cutoff = TimeProvider.System.GetUtcNow();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid runId = Guid.NewGuid();
        RunArchiveBatchResult committed = new()
        {
            UpdatedCount = 1,
            ArchivedRuns = [new ArchivedRunScopeRow
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
            }],
        };
        Mock<IRunRepository> inner = new();
        inner.Setup(r => r.ArchiveRunsCreatedBeforeAsync(cutoff, caller.Token))
            .Returns(() =>
            {
                caller.Cancel();
                return Task.FromResult(committed);
            });
        Mock<IHotPathReadCache> cache = new();
        cache.Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken token) =>
                token.IsCancellationRequested ? Task.FromCanceled(token) : Task.CompletedTask);
        CachingRunRepository repo = new(inner.Object, cache.Object);

        RunArchiveBatchResult result = await repo.ArchiveRunsCreatedBeforeAsync(cutoff, caller.Token);

        result.Should().BeSameAs(committed);
        cache.Verify(c => c.RemoveAsync(HotPathCacheKeys.Run(scope, runId), CancellationToken.None), Times.Once);
        cache.Verify(c => c.RemoveAsync(HotPathCacheKeys.RunListScopeRevision(scope), CancellationToken.None), Times.Once);
    }

    [SkippableFact]
    public async Task ArchiveRunsByIdsAsync_evicts_cached_rows_when_caller_cancels_after_commit()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        RunRecord run = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };
        Guid[] runIds = [run.RunId];
        RunArchiveByIdsResult committed = new()
        {
            SucceededRunIds = runIds,
            ArchivedRuns = [new ArchivedRunScopeRow
            {
                RunId = run.RunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
            }],
        };

        using CancellationTokenSource caller = new();
        bool archived = false;
        Mock<IRunRepository> inner = new();
        inner.Setup(r => r.GetByIdAsync(scope, run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => archived ? null : run);
        inner.Setup(r => r.ListRecentInScopeAsync(scope, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => archived ? Array.Empty<RunRecord>() : new[] { run });
        inner.Setup(r => r.ArchiveRunsByIdsAsync(runIds, caller.Token))
            .Returns(() =>
            {
                archived = true;
                caller.Cancel();
                return Task.FromResult(committed);
            });
        CachingRunRepository repo = new(inner.Object, HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions()));

        (await repo.GetByIdAsync(scope, run.RunId, CancellationToken.None)).Should().NotBeNull();
        (await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None)).Should().ContainSingle();

        RunArchiveByIdsResult? result = null;
        Exception? archiveError = await Record.ExceptionAsync(async () =>
        {
            result = await repo.ArchiveRunsByIdsAsync(runIds, caller.Token);
        });

        (await repo.GetByIdAsync(scope, run.RunId, CancellationToken.None)).Should().BeNull();
        (await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None)).Should().BeEmpty();
        archiveError.Should().BeNull();
        result.Should().BeSameAs(committed);
    }
}
