using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingTenantLegalHoldTests
{
    [Fact]
    public async Task TrySetLegalHoldAsync_invalidates_cache_after_a_completed_write_when_request_cancels()
    {
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 11, 16, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset until = now.AddDays(1);
        using CancellationTokenSource request = new();
        TaskCompletionSource<bool> committed = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.TrySetTenantErasureLegalHoldAsync(
                tenantId, until, now, "Retain evidence", "operator", request.Token))
            .Returns(committed.Task);

        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        string key = HotPathCacheKeys.TenantById(tenantId);
        cache.Setup(store => store.RemoveAsync(key, It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((_, token) => token.ThrowIfCancellationRequested())
            .Returns(Task.CompletedTask);
        CachingTenantRepository repository = new(inner.Object, cache.Object);

        Task<bool> pending = repository.TrySetTenantErasureLegalHoldAsync(
            tenantId, until, now, "Retain evidence", "operator", request.Token);
        try
        {
            cache.Verify(store => store.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
            pending.IsCompleted.Should().BeFalse();
        }
        finally
        {
            request.Cancel();
            committed.TrySetResult(true);
        }

        (await pending).Should().BeTrue();
        inner.VerifyAll();

        cache.Verify(store => store.RemoveAsync(key, CancellationToken.None), Times.Once);
    }
}
