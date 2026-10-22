using System.Net;

using ArchLucid.Core.Costing;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesCatalogStructuredLookupEaDiscountTests
{
    [Fact]
    public void TryLookup_applies_tenant_ea_discount_multiplier_to_heuristic_fallback_rows()
    {
        AzureRetailPricesCatalogClient catalog = CreateCatalogReturningNoRetailMatch();
        StubTenantCostSettingsContext tenantContext = new(
            Guid.Parse("11111111-2222-3333-4444-555555555555"),
            eaDiscountMultiplier: 0.8m);
        AzureRetailPricesCatalogStructuredLookup sut = new(catalog, tenantContext);

        bool found = sut.TryLookup("Virtual Machines", "eastus", "Standard_D4s_v5", out AzureRetailPriceRow row);

        found.Should().BeTrue();
        row.IsHeuristicFallback.Should().BeTrue();
        row.UnitPriceUsd.Should().Be(112m);
    }

    [Fact]
    public void TryLookup_leaves_list_price_unchanged_when_multiplier_is_one()
    {
        AzureRetailPricesCatalogClient catalog = CreateCatalogReturningNoRetailMatch();
        StubTenantCostSettingsContext tenantContext = new(
            Guid.Parse("11111111-2222-3333-4444-555555555555"),
            eaDiscountMultiplier: 1.0m);
        AzureRetailPricesCatalogStructuredLookup sut = new(catalog, tenantContext);

        bool found = sut.TryLookup("Virtual Machines", "eastus", "Standard_D4s_v5", out AzureRetailPriceRow row);

        found.Should().BeTrue();
        row.UnitPriceUsd.Should().Be(140m);
    }

    private static AzureRetailPricesCatalogClient CreateCatalogReturningNoRetailMatch()
    {
        Func<HttpClient> httpFactory = () =>
            new HttpClient(new EmptyJsonHttpHandler())
            {
                BaseAddress = new Uri("https://prices.azure.com/"),
            };

        return new AzureRetailPricesCatalogClient(httpFactory, TimeProvider.System, logger: null);
    }

    private sealed class StubTenantCostSettingsContext(Guid tenantId, decimal eaDiscountMultiplier)
        : IAzureRetailPriceTenantCostSettingsContext
    {
        public Guid TenantId { get; } = tenantId;

        public decimal EaDiscountMultiplier { get; } = eaDiscountMultiplier;
    }

    private sealed class EmptyJsonHttpHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"Items\":[],\"NextPageLink\":null}"),
            });
    }
}
