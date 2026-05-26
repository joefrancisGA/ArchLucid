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
}
