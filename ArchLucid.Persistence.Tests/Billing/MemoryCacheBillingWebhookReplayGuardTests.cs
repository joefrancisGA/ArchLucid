using ArchLucid.Core.Billing;
using ArchLucid.Persistence.Billing;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class MemoryCacheBillingWebhookReplayGuardTests
{
    [Fact]
    public async Task RememberAsync_then_HasSeenAsync_returns_true_for_same_event_id()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool firstSeen = await sut.HasSeenAsync("stripe", "evt_123", CancellationToken.None);
        await sut.RememberAsync("stripe", "evt_123", CancellationToken.None);
        bool secondSeen = await sut.HasSeenAsync("stripe", "evt_123", CancellationToken.None);

        firstSeen.Should().BeFalse();
        secondSeen.Should().BeTrue();
    }

    [Fact]
    public async Task HasSeenAsync_is_scoped_by_provider_name()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        await sut.RememberAsync("stripe", "evt_123", CancellationToken.None);

        bool marketplaceSeen = await sut.HasSeenAsync("azure-marketplace", "evt_123", CancellationToken.None);

        marketplaceSeen.Should().BeFalse();
    }

    [Fact]
    public async Task HasSeenAsync_treats_event_id_case_variants_as_same_event()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        await sut.RememberAsync("stripe", "evt_123", CancellationToken.None);

        bool upperCaseSeen = await sut.HasSeenAsync("stripe", "EVT_123", CancellationToken.None);

        upperCaseSeen.Should().BeTrue();
    }

    [Fact]
    public async Task TryRegisterEventAsync_returns_false_when_event_remembered_first()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        await sut.RememberAsync("stripe", "evt_remembered", CancellationToken.None);
        bool claimAfterRemember = await sut.TryRegisterEventAsync("stripe", "evt_remembered", CancellationToken.None);

        claimAfterRemember.Should().BeFalse();
    }

    [Fact]
    public async Task TryRegisterEventAsync_returns_false_when_event_already_registered()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool firstClaim = await sut.TryRegisterEventAsync("stripe", "evt_dup", CancellationToken.None);
        bool secondClaim = await sut.TryRegisterEventAsync("stripe", "evt_dup", CancellationToken.None);

        firstClaim.Should().BeTrue();
        secondClaim.Should().BeFalse();
    }

    [Fact]
    public async Task HasSeenAsync_treats_provider_name_case_variants_as_same_event()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        await sut.RememberAsync("stripe", "evt_provider_case", CancellationToken.None);

        bool upperProviderSeen = await sut.HasSeenAsync("STRIPE", "evt_provider_case", CancellationToken.None);

        upperProviderSeen.Should().BeTrue();
    }

    [Fact]
    public async Task HasSeenAsync_treats_whitespace_padded_event_id_as_same_event()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        await sut.RememberAsync("stripe", "evt_trim", CancellationToken.None);

        bool paddedSeen = await sut.HasSeenAsync("stripe", "  evt_trim  ", CancellationToken.None);

        paddedSeen.Should().BeTrue();
    }

    [Fact]
    public async Task HasSeenAsync_treats_whitespace_padded_provider_name_as_same_event()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        await sut.RememberAsync("stripe", "evt_provider_trim", CancellationToken.None);

        bool paddedProviderSeen = await sut.HasSeenAsync("  stripe  ", "evt_provider_trim", CancellationToken.None);

        paddedProviderSeen.Should().BeTrue();
    }

    [Fact]
    public async Task TryRegisterEventAsync_only_first_concurrent_caller_wins()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 64 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        const int parallelClaims = 16;
        using Barrier startBarrier = new(parallelClaims);
        Task<bool>[] tasks = new Task<bool>[parallelClaims];

        for (int index = 0; index < parallelClaims; index++)
        {
            tasks[index] = Task.Run(async () =>
            {
                startBarrier.SignalAndWait();

                return await sut.TryRegisterEventAsync("stripe", "evt_concurrent", CancellationToken.None);
            });
        }

        bool[] results = await Task.WhenAll(tasks);

        results.Count(claimed => claimed).Should().Be(1);
        results.Count(claimed => !claimed).Should().Be(parallelClaims - 1);
    }

    [Fact]
    public async Task HasSeenAsync_returns_true_after_TryRegisterEventAsync()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 16 });
        MemoryCacheBillingWebhookReplayGuard sut = new(cache, TimeProvider.System);

        bool registered = await sut.TryRegisterEventAsync("stripe", "evt_registered", CancellationToken.None);
        bool seen = await sut.HasSeenAsync("stripe", "evt_registered", CancellationToken.None);

        registered.Should().BeTrue();
        seen.Should().BeTrue();
    }
}
