using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Ensures run writes bump the scope revision stamp so first-page list caches refresh before list TTL expiry
///     (TB-578).
/// </summary>
[Trait("Suite", "Core")]
public sealed class CachingRunRepositoryRunListInvalidationTests
{
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
}
