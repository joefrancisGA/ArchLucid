using System.Data;

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
    public async Task AppendAsync_write_churn_reuses_first_page_cache_within_coalesce_window()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryAuditRepository inner = new();
        CountingAuditRepository counting = new(inner);
        CachingAuditRepository repo = new(counting, hotPath);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTime now = TimeProvider.System.UtcNowDateTime();

        AuditEvent seed = new()
        {
            EventId = Guid.NewGuid(),
            EventType = AuditEventTypes.RunStarted,
            ActorUserId = "user-0",
            ActorUserName = "User Zero",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            OccurredUtc = now.AddMinutes(-5),
        };

        await inner.AppendAsync(seed, CancellationToken.None);

        AuditEventFilter filter = new() { Take = 10 };

        AuditEvent firstAppend = new()
        {
            EventId = Guid.NewGuid(),
            EventType = AuditEventTypes.RunStarted,
            ActorUserId = "user-1",
            ActorUserName = "User One",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            OccurredUtc = now.AddMinutes(-4),
        };

        await repo.AppendAsync(firstAppend, CancellationToken.None);

        await repo.GetFilteredAsync(tenantId, workspaceId, projectId, filter, CancellationToken.None);

        counting.GetFilteredAsyncCallCount.Should().Be(1);

        for (int i = 0; i < 5; i++)
        {
            AuditEvent churn = new()
            {
                EventId = Guid.NewGuid(),
                EventType = AuditEventTypes.RunStarted,
                ActorUserId = $"user-{i + 2}",
                ActorUserName = $"User {i + 2}",
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                OccurredUtc = now.AddMinutes(-i),
            };

            await repo.AppendAsync(churn, CancellationToken.None);
        }

        for (int i = 0; i < 3; i++)
            await repo.GetFilteredAsync(tenantId, workspaceId, projectId, filter, CancellationToken.None);

        counting.GetFilteredAsyncCallCount.Should().Be(1);
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

    private sealed class CountingAuditRepository(IAuditRepository inner) : IAuditRepository
    {
        private readonly IAuditRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

        public int GetFilteredAsyncCallCount { get; private set; }

        public Task AppendAsync(
            AuditEvent auditEvent,
            CancellationToken ct,
            IDbConnection? connection = null,
            IDbTransaction? transaction = null)
            => _inner.AppendAsync(auditEvent, ct, connection, transaction);

        public Task<IReadOnlyList<AuditEvent>> GetByScopeAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            int take,
            CancellationToken ct)
            => _inner.GetByScopeAsync(tenantId, workspaceId, projectId, take, ct);

        public async Task<IReadOnlyList<AuditEvent>> GetFilteredAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            AuditEventFilter filter,
            CancellationToken ct)
        {
            GetFilteredAsyncCallCount++;

            return await _inner.GetFilteredAsync(tenantId, workspaceId, projectId, filter, ct);
        }

        public Task<int> CountFilteredAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            AuditEventFilter filter,
            CancellationToken ct)
            => _inner.CountFilteredAsync(tenantId, workspaceId, projectId, filter, ct);

        public Task<IReadOnlyList<AuditEvent>> GetExportAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            DateTime fromUtc,
            DateTime toUtc,
            int maxRows,
            CancellationToken ct)
            => _inner.GetExportAsync(tenantId, workspaceId, projectId, fromUtc, toUtc, maxRows, ct);

        public Task<IReadOnlyList<AuditEvent>> GetFilteredExportAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            AuditEventFilter filter,
            CancellationToken ct)
            => _inner.GetFilteredExportAsync(tenantId, workspaceId, projectId, filter, ct);

        public IAsyncEnumerable<AuditEvent> StreamFilteredExportAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            AuditEventFilter filter,
            CancellationToken ct)
            => _inner.StreamFilteredExportAsync(tenantId, workspaceId, projectId, filter, ct);
    }
}
