using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantGetByIdRequestCacheTests
{
    [Fact]
    public async Task GetByIdAsync_second_call_same_request_does_not_invoke_inner_twice()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        TenantRecord tenant = new() { Id = tenantId, Name = "Acme", Slug = "acme" };
        Mock<ITenantRepository> inner = new();
        inner.Setup(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        TenantGetByIdRequestCache cache = new(inner.Object);

        TenantRecord? first = await cache.GetByIdAsync(tenantId, CancellationToken.None);
        TenantRecord? second = await cache.GetByIdAsync(tenantId, CancellationToken.None);

        first.Should().BeSameAs(tenant);
        second.Should().BeSameAs(tenant);
        inner.Verify(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_caches_null_result()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Mock<ITenantRepository> inner = new();
        inner.Setup(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantGetByIdRequestCache cache = new(inner.Object);

        (await cache.GetByIdAsync(tenantId, CancellationToken.None)).Should().BeNull();
        (await cache.GetByIdAsync(tenantId, CancellationToken.None)).Should().BeNull();
        inner.Verify(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Concurrent_same_tenant_misses_share_one_inner_read()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord record = new() { Id = tenantId, Name = "Acme", Slug = "acme" };
        TaskCompletionSource<TenantRecord?> pending = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(pending.Task);
        TenantGetByIdRequestCache cache = new(inner.Object);

        Task<TenantRecord?> first = cache.GetByIdAsync(tenantId, CancellationToken.None);
        Task<TenantRecord?> second = cache.GetByIdAsync(tenantId, CancellationToken.None);
        inner.Verify(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);

        pending.SetResult(record);
        (await first).Should().BeSameAs(record);
        (await second).Should().BeSameAs(record);
        (await cache.GetByIdAsync(tenantId, CancellationToken.None)).Should().BeSameAs(record);
        inner.Verify(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Canceled_leader_does_not_cache_failure_or_cancel_independent_waiter()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord record = new() { Id = tenantId, Name = "Acme", Slug = "acme" };
        using CancellationTokenSource leaderCancellation = new();
        TaskCompletionSource<TenantRecord?> pending = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(pending.Task)
            .ReturnsAsync(record);
        TenantGetByIdRequestCache cache = new(inner.Object);

        Task<TenantRecord?> leader = cache.GetByIdAsync(tenantId, leaderCancellation.Token);
        Task<TenantRecord?> independent = cache.GetByIdAsync(tenantId, CancellationToken.None);

        leaderCancellation.Cancel();
        pending.SetCanceled(leaderCancellation.Token);
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => leader);

        (await independent).Should().BeSameAs(record);
        (await cache.GetByIdAsync(tenantId, CancellationToken.None)).Should().BeSameAs(record);
        inner.Verify(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Canceled_follower_does_not_abort_leader_or_poison_cached_result()
    {
        Guid tenantId = Guid.NewGuid();
        TenantRecord record = new() { Id = tenantId, Name = "Acme", Slug = "acme" };
        TaskCompletionSource<TenantRecord?> pending = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(pending.Task);
        TenantGetByIdRequestCache cache = new(inner.Object);
        using CancellationTokenSource followerCancellation = new();

        Task<TenantRecord?> leader = cache.GetByIdAsync(tenantId, CancellationToken.None);
        Task<TenantRecord?> follower = cache.GetByIdAsync(tenantId, followerCancellation.Token);
        followerCancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => follower);

        pending.SetResult(record);
        (await leader).Should().BeSameAs(record);
        (await cache.GetByIdAsync(tenantId, CancellationToken.None)).Should().BeSameAs(record);
        inner.Verify(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Independent_tenant_ids_can_load_concurrently()
    {
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        TenantRecord a = new() { Id = tenantA, Name = "A", Slug = "a" };
        TenantRecord b = new() { Id = tenantB, Name = "B", Slug = "b" };
        TaskCompletionSource<TenantRecord?> pendingA = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource<TenantRecord?> pendingB = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ITenantRepository> inner = new(MockBehavior.Strict);
        inner.Setup(r => r.GetByIdAsync(tenantA, It.IsAny<CancellationToken>())).Returns(pendingA.Task);
        inner.Setup(r => r.GetByIdAsync(tenantB, It.IsAny<CancellationToken>())).Returns(pendingB.Task);
        TenantGetByIdRequestCache cache = new(inner.Object);

        Task<TenantRecord?> first = cache.GetByIdAsync(tenantA, CancellationToken.None);
        Task<TenantRecord?> second = cache.GetByIdAsync(tenantB, CancellationToken.None);
        inner.Verify(r => r.GetByIdAsync(tenantA, It.IsAny<CancellationToken>()), Times.Once);
        inner.Verify(r => r.GetByIdAsync(tenantB, It.IsAny<CancellationToken>()), Times.Once);

        pendingB.SetResult(b);
        pendingA.SetResult(a);
        (await first).Should().BeSameAs(a);
        (await second).Should().BeSameAs(b);
    }

}
