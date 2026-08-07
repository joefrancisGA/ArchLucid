using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

using Moq;

namespace ArchLucid.Persistence.Tests;

/// <summary>TB-2062 — audit list scope revision bumps coalesce during append bursts.</summary>
[Trait("Suite", "Core")]
public sealed class HotPathCacheEvictionAuditListCoalescingTests
{
    [Fact]
    public async Task InvalidateAuditListScopeAsync_skips_second_bump_within_coalesce_window()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        string revisionKey = HotPathCacheKeys.AuditListScopeRevision(scope);
        long nowTicks = TimeProvider.System.GetUtcNow().Ticks;

        Mock<IHotPathReadCache> cache = new();

        cache
            .Setup(c => c.GetOrCreateAsync(
                revisionKey,
                It.IsAny<Func<CancellationToken, Task<RunListScopeRevisionState?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .ReturnsAsync(new RunListScopeRevisionState { Revision = nowTicks });

        cache.Setup(c => c.RemoveAsync(revisionKey, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await HotPathCacheEviction.InvalidateAuditListScopeAsync(cache.Object, scope, CancellationToken.None);

        cache.Verify(c => c.RemoveAsync(revisionKey, It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task InvalidateAuditListScopeAsync_bumps_when_revision_outside_coalesce_window()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        string revisionKey = HotPathCacheKeys.AuditListScopeRevision(scope);
        long staleTicks = TimeProvider.System.GetUtcNow().Ticks
            - TimeSpan.FromSeconds(HotPathCacheEviction.AuditListInvalidationCoalesceSeconds + 1).Ticks;

        Mock<IHotPathReadCache> cache = new();

        cache.Setup(c => c.RemoveAsync(revisionKey, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        cache
            .SetupSequence(c => c.GetOrCreateAsync(
                revisionKey,
                It.IsAny<Func<CancellationToken, Task<RunListScopeRevisionState?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .ReturnsAsync(new RunListScopeRevisionState { Revision = staleTicks })
            .ReturnsAsync(new RunListScopeRevisionState { Revision = TimeProvider.System.GetUtcNow().Ticks });

        await HotPathCacheEviction.InvalidateAuditListScopeAsync(cache.Object, scope, CancellationToken.None);

        cache.Verify(c => c.RemoveAsync(revisionKey, It.IsAny<CancellationToken>()), Times.Once);
    }
}
