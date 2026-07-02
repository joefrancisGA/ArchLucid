using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Ensures audit appends bump the scope revision stamp so first-page list caches refresh before TTL expiry
///     (TB-581).
/// </summary>
[Trait("Suite", "Core")]
public sealed class CachingAuditRepositoryInvalidationTests
{
    [SkippableFact]
    public async Task AppendAsync_refreshes_cached_GetFilteredAsync_first_page()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryAuditRepository inner = new();
        CachingAuditRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTime now = TimeProvider.System.UtcNowDateTime();

        AuditEvent first = new()
        {
            EventId = Guid.NewGuid(),
            EventType = AuditEventTypes.RunStarted,
            ActorUserId = "user-1",
            ActorUserName = "User One",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            OccurredUtc = now.AddMinutes(-1),
        };

        await inner.AppendAsync(first, CancellationToken.None);

        AuditEventFilter filter = new() { Take = 10 };

        IReadOnlyList<AuditEvent> beforeSecondAppend =
            await repo.GetFilteredAsync(tenantId, workspaceId, projectId, filter, CancellationToken.None);

        beforeSecondAppend.Select(e => e.EventId).Should().Equal(first.EventId);

        AuditEvent second = new()
        {
            EventId = Guid.NewGuid(),
            EventType = AuditEventTypes.RunStarted,
            ActorUserId = "user-2",
            ActorUserName = "User Two",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            OccurredUtc = now,
        };

        await repo.AppendAsync(second, CancellationToken.None);

        IReadOnlyList<AuditEvent> afterSecondAppend =
            await repo.GetFilteredAsync(tenantId, workspaceId, projectId, filter, CancellationToken.None);

        afterSecondAppend.Select(e => e.EventId).Should().Equal(second.EventId, first.EventId);
    }

    [SkippableFact]
    public async Task GetFilteredAsync_with_keyset_cursor_bypasses_cache()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryAuditRepository inner = new();
        CachingAuditRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTime now = TimeProvider.System.UtcNowDateTime();

        AuditEvent older = new()
        {
            EventId = Guid.NewGuid(),
            EventType = AuditEventTypes.RunStarted,
            ActorUserId = "user-1",
            ActorUserName = "User One",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            OccurredUtc = now.AddMinutes(-2),
        };

        AuditEvent newer = new()
        {
            EventId = Guid.NewGuid(),
            EventType = AuditEventTypes.RunStarted,
            ActorUserId = "user-2",
            ActorUserName = "User Two",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            OccurredUtc = now,
        };

        await inner.AppendAsync(older, CancellationToken.None);
        await inner.AppendAsync(newer, CancellationToken.None);

        AuditEventFilter firstPage = new() { Take = 1 };

        IReadOnlyList<AuditEvent> pageOne =
            await repo.GetFilteredAsync(tenantId, workspaceId, projectId, firstPage, CancellationToken.None);

        pageOne.Single().EventId.Should().Be(newer.EventId);

        AuditEventFilter secondPage = new()
        {
            Take = 1,
            BeforeUtc = newer.OccurredUtc,
            BeforeEventId = newer.EventId,
        };

        IReadOnlyList<AuditEvent> pageTwo =
            await repo.GetFilteredAsync(tenantId, workspaceId, projectId, secondPage, CancellationToken.None);

        pageTwo.Single().EventId.Should().Be(older.EventId);
    }
}
