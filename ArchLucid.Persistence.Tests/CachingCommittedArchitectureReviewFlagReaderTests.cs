using ArchLucid.Core.Authority;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Repositories;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class CachingCommittedArchitectureReviewFlagReaderTests
{
    [Fact]
    public async Task TenantHasCommittedArchitectureReviewAsync_uses_hot_path_cache_with_run_list_revision()
    {
        Mock<ICommittedArchitectureReviewFlagReader> inner = new();
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = NewScope();
        string revisionKey = HotPathCacheKeys.RunListScopeRevision(scope);
        string flagKey = HotPathCacheKeys.CommittedArchitectureReviewFlag(scope, runListScopeRevision: 0);

        cache.Setup(c => c.GetOrCreateAsync(
                revisionKey,
                It.IsAny<Func<CancellationToken, Task<RunListScopeRevisionState?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .ReturnsAsync(new RunListScopeRevisionState { Revision = 0 });

        cache.Setup(c => c.GetOrCreateAsync(
                flagKey,
                It.IsAny<Func<CancellationToken, Task<CommittedArchitectureReviewFlagCacheEntry?>>>(),
                It.IsAny<CancellationToken>(),
                60))
            .ReturnsAsync(new CommittedArchitectureReviewFlagCacheEntry { HasCommitted = true });

        CachingCommittedArchitectureReviewFlagReader sut = new(inner.Object, cache.Object);

        bool actual = await sut.TenantHasCommittedArchitectureReviewAsync(scope, CancellationToken.None);

        actual.Should().BeTrue();
        inner.Verify(
            i => i.TenantHasCommittedArchitectureReviewAsync(It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TenantHasCommittedArchitectureReviewAsync_returns_false_when_cache_entry_missing()
    {
        Mock<ICommittedArchitectureReviewFlagReader> inner = new();
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = NewScope();

        cache.Setup(c => c.GetOrCreateAsync(
                HotPathCacheKeys.RunListScopeRevision(scope),
                It.IsAny<Func<CancellationToken, Task<RunListScopeRevisionState?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .ReturnsAsync(new RunListScopeRevisionState { Revision = 0 });

        cache.Setup(c => c.GetOrCreateAsync(
                HotPathCacheKeys.CommittedArchitectureReviewFlag(scope, runListScopeRevision: 0),
                It.IsAny<Func<CancellationToken, Task<CommittedArchitectureReviewFlagCacheEntry?>>>(),
                It.IsAny<CancellationToken>(),
                60))
            .ReturnsAsync((CommittedArchitectureReviewFlagCacheEntry?)null);

        CachingCommittedArchitectureReviewFlagReader sut = new(inner.Object, cache.Object);

        bool actual = await sut.TenantHasCommittedArchitectureReviewAsync(scope, CancellationToken.None);

        actual.Should().BeFalse();
    }

    private static ScopeContext NewScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
    }
}
