using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace ArchLucid.Persistence.Tests.Integrations;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MemoryCacheItsmInboundWebhookReplayGuardTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task RememberAsync_then_HasSeenAsync_returns_true_for_same_event()
    {
        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool before = await sut.HasSeenAsync(TenantA, "Jira", "delivery-1", CancellationToken.None);
        await sut.RememberAsync(TenantA, "Jira", "delivery-1", CancellationToken.None);
        bool after = await sut.HasSeenAsync(TenantA, "Jira", "delivery-1", CancellationToken.None);

        before.Should().BeFalse();
        after.Should().BeTrue();
    }

    [Fact]
    public async Task HasSeenAsync_is_scoped_by_tenant()
    {
        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache, TimeProvider.System);

        await sut.RememberAsync(TenantA, "Jira", "KEY-1:Done", CancellationToken.None);

        bool otherTenant = await sut.HasSeenAsync(TenantB, "Jira", "KEY-1:Done", CancellationToken.None);

        otherTenant.Should().BeFalse();
    }

    [Fact]
    public async Task TryClaimAsync_only_first_concurrent_caller_wins()
    {
        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache, TimeProvider.System);

        const int parallelClaims = 16;
        using Barrier startBarrier = new(parallelClaims);
        Task<bool>[] tasks = new Task<bool>[parallelClaims];

        for (int index = 0; index < parallelClaims; index++)
        {
            tasks[index] = Task.Run(async () =>
            {
                startBarrier.SignalAndWait();

                return await sut.TryClaimAsync(TenantA, "Jira", "delivery-concurrent", CancellationToken.None);
            });
        }

        bool[] results = await Task.WhenAll(tasks);

        results.Count(claimed => claimed).Should().Be(1);
        results.Count(claimed => !claimed).Should().Be(parallelClaims - 1);
    }

    [Fact]
    public async Task ReleaseAsync_after_TryClaimAsync_allows_a_new_claim()
    {
        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool first = await sut.TryClaimAsync(TenantA, "Jira", "delivery-retry", CancellationToken.None);
        bool blocked = await sut.TryClaimAsync(TenantA, "Jira", "delivery-retry", CancellationToken.None);
        await sut.ReleaseAsync(TenantA, "Jira", "delivery-retry", CancellationToken.None);
        bool afterRelease = await sut.TryClaimAsync(TenantA, "Jira", "delivery-retry", CancellationToken.None);

        first.Should().BeTrue();
        blocked.Should().BeFalse();
        afterRelease.Should().BeTrue();
    }

    [Fact]
    public async Task TryClaimAsync_treats_provider_name_case_variants_as_same_claim()
    {
        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool first = await sut.TryClaimAsync(TenantA, "Jira", "delivery-provider-case", CancellationToken.None);
        bool second = await sut.TryClaimAsync(TenantA, "jira", "delivery-provider-case", CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeFalse();
    }

    [Fact]
    public async Task TryClaimAsync_treats_event_id_case_variants_as_same_claim()
    {
        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool first = await sut.TryClaimAsync(TenantA, "Jira", "delivery-1", CancellationToken.None);
        bool second = await sut.TryClaimAsync(TenantA, "Jira", "DELIVERY-1", CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeFalse();
    }

    [Fact]
    public async Task RememberAsync_after_TryClaim_blocks_second_claim_without_releasing_first()
    {
        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool claimed = await sut.TryClaimAsync(TenantA, "Jira", "delivery-remember", CancellationToken.None);
        await sut.RememberAsync(TenantA, "Jira", "delivery-remember", CancellationToken.None);
        bool duplicate = await sut.TryClaimAsync(TenantA, "Jira", "delivery-remember", CancellationToken.None);

        claimed.Should().BeTrue();
        duplicate.Should().BeFalse();
        (await sut.HasSeenAsync(TenantA, "Jira", "delivery-remember", CancellationToken.None)).Should().BeTrue();
    }

    [Fact]
    public async Task Delayed_eviction_callback_does_not_remove_a_reclaimed_event()
    {
        List<PostEvictionCallbackRegistration> callbacks = [];
        Mock<IMemoryCache> cache = new();
        Mock<ICacheEntry> entry = new();
        object? cacheKey = null;
        entry.SetupGet(e => e.PostEvictionCallbacks).Returns(callbacks);
        cache.Setup(c => c.CreateEntry(It.IsAny<object>()))
            .Callback<object>(key => cacheKey = key)
            .Returns(entry.Object);

        const string eventId = "delivery-delayed-eviction";
        MemoryCacheItsmInboundWebhookReplayGuard sut = new(cache.Object, TimeProvider.System);

        bool first = await sut.TryClaimAsync(TenantA, "Jira", eventId, CancellationToken.None);
        await sut.ReleaseAsync(TenantA, "Jira", eventId, CancellationToken.None);
        bool reclaimed = await sut.TryClaimAsync(TenantA, "Jira", eventId, CancellationToken.None);

        callbacks.Should().HaveCount(2);
        callbacks[0].EvictionCallback!(cacheKey!, true, EvictionReason.Removed, callbacks[0].State);

        bool duplicate = await sut.TryClaimAsync(TenantA, "Jira", eventId, CancellationToken.None);

        first.Should().BeTrue();
        reclaimed.Should().BeTrue();
        duplicate.Should().BeFalse("an eviction callback for the released entry must not clear the reclaimed event claim");
    }
}