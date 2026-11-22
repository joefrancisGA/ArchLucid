using ArchLucid.Application.SecureNow;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InMemoryCollectionRunTriggerIdempotencyStoreTests
{
    [Fact]
    public void Store_returns_only_live_keys_and_keeps_the_latest_registration()
    {
        using InMemoryCollectionRunTriggerIdempotencyStore store = new();
        Guid oldRunId = Guid.NewGuid();
        Guid newRunId = Guid.NewGuid();

        store.Set("expired", oldRunId, TimeSpan.Zero);
        store.Set("active", oldRunId, TimeSpan.FromMinutes(2));
        store.Set("active", newRunId, TimeSpan.FromMinutes(2));

        Assert.False(store.TryGet("expired", out Guid expiredRunId));
        Assert.Equal(Guid.Empty, expiredRunId);
        Assert.True(store.TryGet("active", out Guid activeRunId));
        Assert.Equal(newRunId, activeRunId);
    }
}
