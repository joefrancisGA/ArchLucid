using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingTenantSuspensionTests
{
    [Fact]
    public async Task TrySuspendTenantAsync_invalidates_cache_after_a_completed_write_when_request_cancels()
    {
        Guid tenantId = Guid.NewGuid();
        using CancellationTokenSource request = new();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.TrySuspendTenantAsync(tenantId, request.Token))
            .Callback(request.Cancel)
            .ReturnsAsync(true);

        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        string key = HotPathCacheKeys.TenantById(tenantId);
        cache.Setup(store => store.RemoveAsync(key, It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((_, token) => token.ThrowIfCancellationRequested())
            .Returns(Task.CompletedTask);
        CachingTenantRepository repository = new(inner.Object, cache.Object);

        (await repository.TrySuspendTenantAsync(tenantId, request.Token)).Should().BeTrue();

        cache.Verify(store => store.RemoveAsync(key, CancellationToken.None), Times.Once);
    }
}
