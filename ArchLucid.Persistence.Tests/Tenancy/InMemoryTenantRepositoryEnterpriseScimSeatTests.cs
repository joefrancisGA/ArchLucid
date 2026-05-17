using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class InMemoryTenantRepositoryEnterpriseScimSeatTests
{
    [SkippableFact]
    public async Task TryIncrementEnterpriseScimSeat_respects_limit_then_decrement_frees()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantRepository sut = new();
        await sut.InsertTenantAsync(
            tenantId,
            "Scim Seat Tenant",
            "slug-scim-seat",
            TenantTier.Enterprise,
            null,
            TenantDataRegions.Default,
            CancellationToken.None,
            2);

        (await sut.TryIncrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None)).Should().BeTrue();
        (await sut.TryIncrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None)).Should().BeTrue();
        (await sut.TryIncrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None)).Should().BeFalse();

        await sut.DecrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None);
        (await sut.TryIncrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None)).Should().BeTrue();
    }

    [SkippableFact]
    public async Task TryIncrementEnterpriseScimSeat_unlimited_when_limit_null()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantRepository sut = new();
        await sut.InsertTenantAsync(tenantId, "Unlim", "slug-unlim", TenantTier.Free, null, TenantDataRegions.Default, CancellationToken.None);

        for (int i = 0; i < 5; i++)
            (await sut.TryIncrementEnterpriseScimSeatAsync(tenantId, CancellationToken.None)).Should().BeTrue();
    }
}
