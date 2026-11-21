using System.Net;
using System.Net.Http.Json;

using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureRetailPricesCatalogClientCacheTests
{
    [Fact]
    public async Task TryGetConsumptionMonthlyUsdAsync_retries_after_a_failed_request()
    {
        using RecoveringRetailHandler handler = new();
        using HttpClient httpClient = new(handler, disposeHandler: false);
        AzureRetailPricesCatalogClient retailPrices = new(() => httpClient, TimeProvider.System, logger: null);

        decimal? first = await retailPrices.TryGetConsumptionMonthlyUsdAsync(
            "Virtual Machines", "eastus", "Standard_D2s_v3", 1, CancellationToken.None);
        decimal? retry = await retailPrices.TryGetConsumptionMonthlyUsdAsync(
            "Virtual Machines", "eastus", "Standard_D2s_v3", 1, CancellationToken.None);

        first.Should().BeNull();
        retry.Should().Be(730m);
        handler.RequestCount.Should().Be(2);
    }

    private sealed class RecoveringRetailHandler : HttpMessageHandler
    {
        public int RequestCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestCount++;
            return Task.FromResult(RequestCount == 1
                ? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                : new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = JsonContent.Create(new
                    {
                        Items = new[]
                        {
                            new
                            {
                                CurrencyCode = "USD",
                                Type = "Consumption",
                                UnitOfMeasure = "1 Hour",
                                UnitPrice = 1m,
                                SkuName = "Standard_D2s_v3",
                                ServiceName = "Virtual Machines",
                                ArmRegionName = "eastus",
                            },
                        },
                    }),
                });
        }
    }
}
