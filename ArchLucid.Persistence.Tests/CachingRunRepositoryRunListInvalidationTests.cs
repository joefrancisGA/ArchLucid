using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Moq;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Ensures run writes bump the scope revision stamp so first-page list caches refresh before list TTL expiry
///     (TB-578).
/// </summary>
[Trait("Suite", "Core")]
public sealed class CachingRunRepositoryRunListInvalidationTests
{
    [Fact]
    public async Task Transactional_promotion_keeps_cache_until_the_commit_owner_evicts_it()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
        };
        Guid runId = Guid.NewGuid();
        bool committed = false;
        RunRecord Read() => new() { RunId = runId, LegacyRunStatus = committed ? "Committed" : "Created" };
        Mock<IRunRepository> inner = new();
        inner.Setup(repo => repo.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(Read);
        inner.Setup(repo => repo.ListRecentInScopeAsync(scope, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new[] { Read() });
        CachingRunRepository cache = new(inner.Object, HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions()));
        CancellationToken ct = CancellationToken.None;

        (await cache.GetByIdAsync(scope, runId, ct))!.LegacyRunStatus.Should().Be("Created");
        (await cache.ListRecentInScopeAsync(scope, 10, ct)).Should().ContainSingle().Which.LegacyRunStatus.Should().Be("Created");

        await cache.MarkAuthorityPipelineCommittedAsync(
            scope, runId, Guid.NewGuid(), DateTime.UtcNow, ct,
            Mock.Of<IDbConnection>(), Mock.Of<IDbTransaction>());

        committed = true;
        (await cache.GetByIdAsync(scope, runId, ct))!.LegacyRunStatus.Should().Be("Created");
        (await cache.ListRecentInScopeAsync(scope, 10, ct)).Should().ContainSingle().Which.LegacyRunStatus.Should().Be("Created");

        await cache.EvictCachedRunAsync(scope, runId, ct);

        (await cache.GetByIdAsync(scope, runId, ct))!.LegacyRunStatus.Should().Be("Committed");
        (await cache.ListRecentInScopeAsync(scope, 10, ct)).Should().ContainSingle().Which.LegacyRunStatus.Should().Be("Committed");
    }

    [SkippableFact]
    public async Task SaveAsync_refreshes_cached_ListRecentInScope_first_page()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryRunRepository inner = new();
        CachingRunRepository repo = new(inner, hotPath);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime now = TimeProvider.System.UtcNowDateTime();

        RunRecord first = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            CreatedUtc = now.AddHours(-1),
        };

        await inner.SaveAsync(first, CancellationToken.None);

        IReadOnlyList<RunRecord> beforeSecondSave =
            await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None);

        beforeSecondSave.Select(r => r.RunId).Should().Equal(first.RunId);

        RunRecord second = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            CreatedUtc = now,
        };

        await repo.SaveAsync(second, CancellationToken.None);

        IReadOnlyList<RunRecord> afterSecondSave =
            await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None);

        afterSecondSave.Select(r => r.RunId).Should().Equal(second.RunId, first.RunId);
    }

    [SkippableFact]
    public async Task UpdateAsync_refreshes_cached_ListByProjectKeyset_first_page()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryRunRepository inner = new();
        CachingRunRepository repo = new(inner, hotPath);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        const string projectSlug = "default";
        DateTime now = TimeProvider.System.UtcNowDateTime();

        RunRecord run = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = projectSlug,
            CreatedUtc = now.AddHours(-2),
            LegacyRunStatus = "Created",
        };

        await inner.SaveAsync(run, CancellationToken.None);

        RunListPage beforeUpdate =
            await repo.ListByProjectKeysetAsync(scope, projectSlug, null, null, 10, CancellationToken.None);

        beforeUpdate.Items.Select(r => r.LegacyRunStatus).Should().Equal("Created");

        run.LegacyRunStatus = "Committed";
        await repo.UpdateAsync(run, CancellationToken.None);

        RunListPage afterUpdate =
            await repo.ListByProjectKeysetAsync(scope, projectSlug, null, null, 10, CancellationToken.None);

        afterUpdate.Items.Single().LegacyRunStatus.Should().Be("Committed");
    }

    [SkippableFact]
    public async Task SaveAsync_refreshes_run_list_when_caller_cancels_after_insert()
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
            ProjectId = "default",
        };
        using CancellationTokenSource caller = new();
        IReadOnlyList<RunRecord> stored = [];
        Mock<IRunRepository> inner = new();
        inner.Setup(r => r.ListRecentInScopeAsync(scope, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => stored);
        inner.Setup(r => r.SaveAsync(run, caller.Token, null, null))
            .Returns(() =>
            {
                stored = [run];
                caller.Cancel();
                return Task.CompletedTask;
            });
        CachingRunRepository repo = new(
            inner.Object,
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions()));

        (await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None)).Should().BeEmpty();

        Exception? saveError = await Record.ExceptionAsync(() => repo.SaveAsync(run, caller.Token));

        (await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None)).Should().ContainSingle()
            .Which.RunId.Should().Be(run.RunId);
        saveError.Should().BeNull();
    }

    [SkippableFact]
    public async Task UpdateAsync_refreshes_run_and_list_when_caller_cancels_after_write()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid runId = Guid.NewGuid();
        RunRecord CreateRun(string status) => new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            LegacyRunStatus = status,
        };

        using CancellationTokenSource caller = new();
        RunRecord stored = CreateRun("Created");
        Mock<IRunRepository> inner = new();
        inner.Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => stored);
        inner.Setup(r => r.ListRecentInScopeAsync(scope, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new[] { stored });
        RunRecord updated = CreateRun("Failed");
        inner.Setup(r => r.UpdateAsync(updated, caller.Token, null, null))
            .Returns(() =>
            {
                stored = updated;
                caller.Cancel();
                return Task.CompletedTask;
            });
        CachingRunRepository repo = new(
            inner.Object,
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions()));

        (await repo.GetByIdAsync(scope, runId, CancellationToken.None))!.LegacyRunStatus.Should().Be("Created");
        (await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None)).Single()
            .LegacyRunStatus.Should().Be("Created");

        Exception? updateError = await Record.ExceptionAsync(() => repo.UpdateAsync(updated, caller.Token));

        (await repo.GetByIdAsync(scope, runId, CancellationToken.None))!.LegacyRunStatus.Should().Be("Failed");
        (await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None)).Single()
            .LegacyRunStatus.Should().Be("Failed");
        updateError.Should().BeNull();
    }

    [SkippableFact]
    public async Task ListByProject_does_not_coalesce_unpaged_and_keyset_cache_misses()
    {
        Mock<IRunRepository> inner = new();
        CachingRunRepository repo = new(inner.Object, HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions()));
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        const string project = "default";
        CancellationToken ct = CancellationToken.None;
        RunRecord run = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = project,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
        TaskCompletionSource started = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource<IReadOnlyList<RunRecord>> pendingRows = new(TaskCreationOptions.RunContinuationsAsynchronously);
        inner.Setup(source => source.ListByProjectAsync(scope, project, 10, It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                started.SetResult();
                return pendingRows.Task;
            });
        inner.Setup(source => source.ListByProjectKeysetAsync(scope, project, null, null, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunListPage([run], HasMore: true));

        Task<IReadOnlyList<RunRecord>> unpaged = repo.ListByProjectAsync(scope, project, 10, ct);
        try
        {
            await started.Task.WaitAsync(TimeSpan.FromSeconds(5));
            RunListPage page = await repo.ListByProjectKeysetAsync(scope, project, null, null, 10, ct)
                .WaitAsync(TimeSpan.FromSeconds(5));

            page.Items.Select(row => row.RunId).Should().Equal(run.RunId);
            page.HasMore.Should().BeTrue();
        }
        finally
        {
            pendingRows.SetResult([run]);
            (await unpaged).Select(row => row.RunId).Should().Equal(run.RunId);
        }
    }

    [SkippableFact]
    public async Task ListRecentInScope_first_page_cache_isolated_per_list_shape()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryRunRepository inner = new();
        CachingRunRepository repo = new(inner, hotPath);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        DateTime now = TimeProvider.System.UtcNowDateTime();

        RunRecord newer = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            CreatedUtc = now,
        };

        RunRecord older = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            CreatedUtc = now.AddHours(-1),
        };

        await inner.SaveAsync(older, CancellationToken.None);
        await inner.SaveAsync(newer, CancellationToken.None);

        RunListPage keysetPage =
            await repo.ListRecentInScopeKeysetAsync(scope, null, null, 10, CancellationToken.None);

        IReadOnlyList<RunRecord> unpagedList =
            await repo.ListRecentInScopeAsync(scope, 10, CancellationToken.None);

        unpagedList.Select(r => r.RunId).Should().Equal(newer.RunId, older.RunId);

        RunListPage offsetPage =
            await repo.ListRecentInScopeOffsetAsync(scope, 0, 10, CancellationToken.None);

        offsetPage.Items.Select(r => r.RunId).Should().Equal(keysetPage.Items.Select(r => r.RunId));
    }
}
