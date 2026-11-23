using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingTenantTrialLifecycleEvictionTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Trial_transition_evicts_only_when_recorded_even_if_request_cancels(bool recorded)
    {
        Guid tenantId = Guid.NewGuid();
        using CancellationTokenSource request = new();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.TryRecordTrialLifecycleTransitionAsync(
                tenantId, "trial", "expired", "automation", request.Token))
            .Callback(request.Cancel)
            .ReturnsAsync(recorded);

        string key = HotPathCacheKeys.TenantById(tenantId);
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        if (recorded)
        {
            cache.Setup(store => store.RemoveAsync(key, It.IsAny<CancellationToken>()))
                .Callback<string, CancellationToken>((_, token) => token.ThrowIfCancellationRequested())
                .Returns(Task.CompletedTask);
        }

        CachingTenantRepository sut = new(inner.Object, cache.Object);

        (await sut.TryRecordTrialLifecycleTransitionAsync(
            tenantId, "trial", "expired", "automation", request.Token)).Should().Be(recorded);

        request.IsCancellationRequested.Should().BeTrue();
        inner.VerifyAll();
        cache.Verify(store => store.RemoveAsync(key, CancellationToken.None),
            recorded ? Times.Once() : Times.Never());
    }

    [Fact]
    public async Task Completed_baseline_update_evicts_even_if_request_cancels_after_write()
    {
        Guid tenantId = Guid.NewGuid();
        using CancellationTokenSource request = new();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.UpdateBaselineAsync(
                tenantId, 4m, 2, It.IsAny<DateTimeOffset?>(), request.Token))
            .Callback(request.Cancel)
            .Returns(Task.CompletedTask);

        string key = HotPathCacheKeys.TenantById(tenantId);
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        cache.Setup(store => store.RemoveAsync(key, It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((_, token) => token.ThrowIfCancellationRequested())
            .Returns(Task.CompletedTask);
        CachingTenantRepository sut = new(inner.Object, cache.Object);

        await sut.UpdateBaselineAsync(tenantId, 4m, 2, null, request.Token);

        request.IsCancellationRequested.Should().BeTrue();
        inner.VerifyAll();
        cache.Verify(store => store.RemoveAsync(key, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Failed_preseed_write_does_not_evict()
    {
        Guid tenantId = Guid.NewGuid();
        using CancellationTokenSource request = new();
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(repository => repository.EnqueueTrialArchitecturePreseedAsync(tenantId, request.Token))
            .ThrowsAsync(new InvalidOperationException("write failed"));
        Mock<IHotPathReadCache> cache = new(MockBehavior.Strict);
        CachingTenantRepository sut = new(inner.Object, cache.Object);

        Func<Task> act = () => sut.EnqueueTrialArchitecturePreseedAsync(tenantId, request.Token);

        await act.Should().ThrowAsync<InvalidOperationException>();
        inner.VerifyAll();
        cache.Verify(store => store.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
