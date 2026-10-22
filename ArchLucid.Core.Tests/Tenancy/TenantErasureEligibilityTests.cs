using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantErasureEligibilityTests
{
    [Fact]
    public void IsTenantLoginBlocked_true_when_offboarded()
    {
        TenantRecord tenant = CreateTenant(offboardedUtc: DateTimeOffset.UtcNow);

        TenantErasureEligibility.IsTenantLoginBlocked(tenant, DateTimeOffset.UtcNow).Should().BeTrue();
    }

    [Fact]
    public void IsTenantLoginBlocked_true_when_erasure_requested_in_past()
    {
        DateTimeOffset now = new(2026, 5, 26, 12, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = CreateTenant(tenantErasureRequestedUtc: now.AddHours(-1));

        TenantErasureEligibility.IsTenantLoginBlocked(tenant, now).Should().BeTrue();
    }

    [Fact]
    public void IsTenantLoginBlocked_false_when_erasure_requested_in_future()
    {
        DateTimeOffset now = new(2026, 5, 26, 12, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = CreateTenant(tenantErasureRequestedUtc: now.AddDays(1));

        TenantErasureEligibility.IsTenantLoginBlocked(tenant, now).Should().BeFalse();
    }

    private static TenantRecord CreateTenant(
        DateTimeOffset? offboardedUtc = null,
        DateTimeOffset? tenantErasureRequestedUtc = null)
    {
        return new TenantRecord
        {
            Id = Guid.NewGuid(),
            Name = "Test",
            Slug = "test",
            Tier = TenantTier.Standard,
            CreatedUtc = DateTimeOffset.UtcNow,
            OffboardedUtc = offboardedUtc,
            TenantErasureRequestedUtc = tenantErasureRequestedUtc,
        };
    }
}
