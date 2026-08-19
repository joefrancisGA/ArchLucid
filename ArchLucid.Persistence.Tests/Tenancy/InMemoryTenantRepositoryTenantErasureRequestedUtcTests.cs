using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantRepositoryTenantErasureRequestedUtcTests
{
    [Fact]
    public async Task TryStartTenantErasureOffboardAsync_sets_TenantErasureRequestedUtc_to_offboard_timestamp()
    {
        InMemoryTenantRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        await sut.InsertTenantAsync(
            tenantId,
            "Erasure Tenant",
            "erasure-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset offboardedUtc = new(2026, 5, 26, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset erasureEligibleUtc = offboardedUtc.AddDays(30);

        bool started = await sut.TryStartTenantErasureOffboardAsync(
            tenantId,
            offboardedUtc,
            erasureEligibleUtc,
            CancellationToken.None);

        started.Should().BeTrue();

        TenantRecord? tenant = await sut.GetByIdAsync(tenantId, CancellationToken.None);

        tenant.Should().NotBeNull();
        tenant!.OffboardedUtc.Should().Be(offboardedUtc);
        tenant.TenantErasureRequestedUtc.Should().Be(offboardedUtc);
    }
}
