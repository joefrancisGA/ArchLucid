using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

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
}
