using ArchLucid.Application.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TenantTrialSeatSkipCacheTests
{
    [Fact]
    public void IsSeatClaimNotRequired_false_for_empty_tenant()
    {
        TenantTrialSeatSkipCache cache = CreateCache();

        cache.IsSeatClaimNotRequired(Guid.Empty).Should().BeFalse();
    }

    [Fact]
    public void RememberSeatClaimNotRequired_skips_empty_tenant_and_caches_real_tenant()
    {
        TenantTrialSeatSkipCache cache = CreateCache();
        Guid tenantId = Guid.NewGuid();

        cache.RememberSeatClaimNotRequired(Guid.Empty);
        cache.IsSeatClaimNotRequired(Guid.Empty).Should().BeFalse();

        cache.RememberSeatClaimNotRequired(tenantId);
        cache.IsSeatClaimNotRequired(tenantId).Should().BeTrue();
    }

    private static TenantTrialSeatSkipCache CreateCache()
    {
        return new TenantTrialSeatSkipCache(new MemoryCache(new MemoryCacheOptions()));
    }
}
