using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class CachingTenantSettingsRepositoryTests
{
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
