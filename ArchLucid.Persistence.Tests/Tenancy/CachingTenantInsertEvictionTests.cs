using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingTenantInsertEvictionTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Successful_tenant_insert_always_evicts_cached_tenant_even_after_request_cancellation(
        bool cancelAfterCommit)
    {
        Guid tenantId = Guid.NewGuid();
        using CancellationTokenSource request = new();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.InsertTenantAsync(
                tenantId, "New tenant", "new-tenant", TenantTier.Free,
                null, "us-east", request.Token, null))
            .Callback(() =>
            {
                if (cancelAfterCommit)
                    request.Cancel();
            })
            .Returns(Task.CompletedTask);
        string key = HotPathCacheKeys.TenantById(tenantId);
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        cache.Setup(store => store.RemoveAsync(key, It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((_, token) => token.ThrowIfCancellationRequested())
            .Returns(Task.CompletedTask);

        CachingTenantRepository sut = new(inner.Object, cache.Object);
        await sut.InsertTenantAsync(
            tenantId, "New tenant", "new-tenant", TenantTier.Free,
            null, "us-east", request.Token);

        request.IsCancellationRequested.Should().Be(cancelAfterCommit);
        inner.VerifyAll();
        cache.Verify(store => store.RemoveAsync(key, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Failed_tenant_insert_preserves_error_and_does_not_evict()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.InsertTenantAsync(
                tenantId, "New tenant", "new-tenant", TenantTier.Free,
                null, "us-east", CancellationToken.None, null))
            .ThrowsAsync(new InvalidOperationException("duplicate slug"));
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        CachingTenantRepository sut = new(inner.Object, cache.Object);

        Func<Task> action = () => sut.InsertTenantAsync(
            tenantId, "New tenant", "new-tenant", TenantTier.Free,
            null, "us-east", CancellationToken.None);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("duplicate slug");
        inner.VerifyAll();
        cache.Verify(store => store.RemoveAsync(
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
