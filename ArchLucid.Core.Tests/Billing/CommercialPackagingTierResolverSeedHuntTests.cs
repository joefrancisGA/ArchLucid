using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Billing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CommercialPackagingTierResolverSeedHuntTests
{
    [Fact]
    public void ResolveCommercialTierLabel_returns_null_for_lowercase_active_trial_status()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = DateTime.UtcNow,
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = "active",
        };

        string? label = CommercialPackagingTierResolver.ResolveCommercialTierLabel(tenant, null, 1, 2);

        label.Should().BeNull();
    }
}
