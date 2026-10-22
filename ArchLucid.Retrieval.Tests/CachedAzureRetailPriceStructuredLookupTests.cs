using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class CachedAzureRetailPriceStructuredLookupTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public void TryLookup_second_request_for_same_sku_uses_memory_cache()
    {
        CountingAzureRetailPriceStructuredLookup inner = new();
        MemoryCache memoryCache = new(new MemoryCacheOptions { SizeLimit = 32 });
        StubTenantCostSettingsContext tenantContext = new(TenantId, 1.0m);
        CachedAzureRetailPriceStructuredLookup sut = new(inner, memoryCache, tenantContext, TimeProvider.System);

        bool first = sut.TryLookup("Virtual Machines", "eastus", "Standard_D2s_v5", out AzureRetailPriceRow firstRow);
        bool second = sut.TryLookup("Virtual Machines", "eastus", "Standard_D2s_v5", out AzureRetailPriceRow secondRow);

        first.Should().BeTrue();
        second.Should().BeTrue();
        inner.LookupCalls.Should().Be(1);
        secondRow.Should().BeEquivalentTo(firstRow);
    }

    [Fact]
    public void BuildCacheKey_includes_tenant_and_ea_multiplier()
    {
        string keyA = CachedAzureRetailPriceStructuredLookup.BuildCacheKey(
            TenantId,
            0.8m,
            "Virtual Machines",
            "eastus",
            "Standard_D2s_v5");
        string keyB = CachedAzureRetailPriceStructuredLookup.BuildCacheKey(
            TenantId,
            1.0m,
            "Virtual Machines",
            "eastus",
            "Standard_D2s_v5");

        keyA.Should().NotBe(keyB);
    }

    private sealed class CountingAzureRetailPriceStructuredLookup : IAzureRetailPriceStructuredLookup
    {
        private readonly InMemoryAzureRetailPriceStructuredLookup _inner = new();

        public int LookupCalls
        {
            get;
            private set;
        }

        public bool TryLookup(string serviceName, string region, string? sku, out AzureRetailPriceRow row)
        {
            LookupCalls++;

            return _inner.TryLookup(serviceName, region, sku, out row);
        }

        public string FormatForPrompt(AzureRetailPriceRow row) => _inner.FormatForPrompt(row);
    }

    private sealed class StubTenantCostSettingsContext(Guid tenantId, decimal eaDiscountMultiplier)
        : IAzureRetailPriceTenantCostSettingsContext
    {
        public Guid TenantId { get; } = tenantId;

        public decimal EaDiscountMultiplier { get; } = eaDiscountMultiplier;
    }
}
