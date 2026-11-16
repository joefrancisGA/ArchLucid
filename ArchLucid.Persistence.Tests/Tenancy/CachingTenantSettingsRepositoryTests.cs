using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class CachingTenantSettingsRepositoryTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Committed_write_finishes_cache_eviction_after_caller_cancels(bool delete)
    {
        using CancellationTokenSource request = new();
        Guid tenantId = Guid.NewGuid();
        const string key = "example-setting";
        Mock<ITenantSettingsRepository> inner = new(MockBehavior.Strict);
        inner.Setup(x => x.UpsertAsync(tenantId, key, "new", request.Token))
            .Callback(request.Cancel).Returns(Task.CompletedTask);
        inner.Setup(x => x.DeleteAsync(tenantId, key, request.Token))
            .Callback(request.Cancel).Returns(Task.CompletedTask);
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        cache.Setup(x => x.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken ct) => ct.IsCancellationRequested ? Task.FromCanceled(ct) : Task.CompletedTask);
        CachingTenantSettingsRepository repository = new(inner.Object, cache.Object);

        if (delete)
            await repository.DeleteAsync(tenantId, key, request.Token);
        else
            await repository.UpsertAsync(tenantId, key, "new", request.Token);

        string cacheKeyPrefix = HotPathCacheKeys.TenantSetting(tenantId, key) + ":";
        cache.Verify(x => x.RemoveAsync(
            It.Is<string>(cacheKey => cacheKey.StartsWith(cacheKeyPrefix, StringComparison.Ordinal)),
            CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Reads_bypass_cache_until_all_overlapping_writes_finish()
    {
        Guid tenantId = Guid.NewGuid();
        const string key = "example-setting";
        CancellationToken ct = CancellationToken.None;
        TaskCompletionSource pendingUpsert = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ITenantSettingsRepository> inner = new();
        inner.Setup(repository => repository.UpsertAsync(tenantId, key, "new", ct))
            .Returns(pendingUpsert.Task);
        inner.Setup(repository => repository.DeleteAsync(tenantId, key, ct))
            .Returns(Task.CompletedTask);
        inner.Setup(repository => repository.TryGetAsync(tenantId, key, It.IsAny<CancellationToken>()))
            .ReturnsAsync("value");
        CachingTenantSettingsRepository repository = new(
            inner.Object,
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions()));

        Task upsert = repository.UpsertAsync(tenantId, key, "new", ct);
        try
        {
            upsert.IsCompleted.Should().BeFalse();
            await repository.DeleteAsync(tenantId, key, ct);
            await repository.TryGetAsync(tenantId, key, ct);
            await repository.TryGetAsync(tenantId, key, ct);
            inner.Verify(
                source => source.TryGetAsync(tenantId, key, It.IsAny<CancellationToken>()),
                Times.Exactly(2));
        }
        finally
        {
            pendingUpsert.SetResult();
            await upsert;
        }

        await repository.TryGetAsync(tenantId, key, ct);
        await repository.TryGetAsync(tenantId, key, ct);
        inner.Verify(source => source.TryGetAsync(tenantId, key, It.IsAny<CancellationToken>()), Times.Exactly(3));
    }
}
