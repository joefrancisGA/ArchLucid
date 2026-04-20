using System.Text.Json;

using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing.AzureMarketplace;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class MarketplaceWebhookPayloadParserTests
{
    [Theory]
    [InlineData("team", nameof(TenantTier.Standard))]
    [InlineData("Contoso-Enterprise-Plan", nameof(TenantTier.Enterprise))]
    public void TierStorageCodeFromPlanId_maps_enterprise_substring(string planId, string expected)
    {
        MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId(planId).Should().Be(expected);
    }

    [Fact]
    public void ReadQuantity_parses_number_and_string()
    {
        using JsonDocument n = JsonDocument.Parse("""{"quantity":7}""");

        MarketplaceWebhookPayloadParser.ReadQuantity(n.RootElement, 1).Should().Be(7);

        using JsonDocument s = JsonDocument.Parse("""{"quantity":"9"}""");

        MarketplaceWebhookPayloadParser.ReadQuantity(s.RootElement, 1).Should().Be(9);
    }
}
