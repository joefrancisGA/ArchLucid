using System.Text.Json;

using ArchLucid.Core.Billing.AzureMarketplace;
using ArchLucid.Core.Tenancy;

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

    [SkippableFact]
    public void ReadQuantity_parses_number_and_string()
    {
        using JsonDocument n = JsonDocument.Parse("""{"quantity":7}""");

        MarketplaceWebhookPayloadParser.ReadQuantity(n.RootElement).Should().Be(7);

        using JsonDocument s = JsonDocument.Parse("""{"quantity":"9"}""");

        MarketplaceWebhookPayloadParser.ReadQuantity(s.RootElement).Should().Be(9);
    }

    [Fact]
    public void TryGetPlanId_reads_PascalCase_planId()
    {
        using JsonDocument document = JsonDocument.Parse("""{"PlanId":"Contoso-Enterprise-Plan","quantity":5}""");

        bool ok = MarketplaceWebhookPayloadParser.TryGetPlanId(document.RootElement, out string? planId);

        ok.Should().BeTrue();
        planId.Should().Be("Contoso-Enterprise-Plan");
        MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId(planId).Should().Be(nameof(TenantTier.Enterprise));
    }
}
