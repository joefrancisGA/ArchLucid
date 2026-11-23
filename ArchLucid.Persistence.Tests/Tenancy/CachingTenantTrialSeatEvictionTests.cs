using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingTenantTrialSeatEvictionTests
{
    [Fact]
    public async Task Completed_seat_claim_invalidates_cached_tenant()
    {
        Guid tenantId = Guid.NewGuid();
        const string principalKey = "seat-owner";
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.TryClaimTrialSeatAsync(
                tenantId, principalKey, CancellationToken.None))
            .Returns(Task.CompletedTask);
        Mock<IHotPathReadCache> cache = CreateCache(tenantId);
        CachingTenantRepository sut = new(inner.Object, cache.Object);

        await sut.TryClaimTrialSeatAsync(tenantId, principalKey, CancellationToken.None);

        inner.VerifyAll();
        cache.Verify(store => store.RemoveAsync(
            HotPathCacheKeys.TenantById(tenantId), CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Cancellation_after_successful_seat_write_cannot_suppress_eviction()
    {
        Guid tenantId = Guid.NewGuid();
        using CancellationTokenSource request = new();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.TryClaimTrialSeatAsync(
                tenantId, "owner", request.Token))
            .Callback(request.Cancel)
            .Returns(Task.CompletedTask);

        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        string key = HotPathCacheKeys.TenantById(tenantId);
        cache.Setup(store => store.RemoveAsync(key, It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((_, token) => token.ThrowIfCancellationRequested())
            .Returns(Task.CompletedTask);
        CachingTenantRepository sut = new(inner.Object, cache.Object);

        await sut.TryClaimTrialSeatAsync(tenantId, "owner", request.Token);

        request.IsCancellationRequested.Should().BeTrue();
        cache.Verify(store => store.RemoveAsync(key, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Rejected_seat_claim_does_not_evict_or_hide_original_error()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.TryClaimTrialSeatAsync(
                tenantId, "over-limit", CancellationToken.None))
            .ThrowsAsync(new InvalidOperationException("seat claim failed"));
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        CachingTenantRepository sut = new(inner.Object, cache.Object);

        Func<Task> action = () => sut.TryClaimTrialSeatAsync(
            tenantId, "over-limit", CancellationToken.None);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("seat claim failed");
        cache.Verify(store => store.RemoveAsync(
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static Mock<IHotPathReadCache> CreateCache(Guid tenantId)
    {
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        cache.Setup(store => store.RemoveAsync(
                HotPathCacheKeys.TenantById(tenantId), CancellationToken.None))
            .Returns(Task.CompletedTask);
        return cache;
    }
}
