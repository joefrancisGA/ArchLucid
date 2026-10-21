using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BillingOptionsNormalizePostConfigureTests
{
    [Fact]
    public void PostConfigure_trims_plan_id_tier_map_keys_from_configuration_binding()
    {
        BillingOptions options = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                PlanIdTierMap = new Dictionary<string, string>
                {
                    ["  contoso-enterprise  "] = nameof(TenantTier.Enterprise),
                },
            },
        };

        new BillingOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        options.AzureMarketplace.PlanIdTierMap.Should().ContainKey("contoso-enterprise");
        options.AzureMarketplace.PlanIdTierMap!["contoso-enterprise"]
            .Should()
            .Be(nameof(TenantTier.Enterprise));
    }
}
