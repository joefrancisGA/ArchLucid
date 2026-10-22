using System.Net;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InfrastructureMonthlyUsdCostEstimatorCancellationTests
{
    [Fact]
    public async Task EstimateNodesAsync_propagates_cancellation_from_live_pricing_probe()
    {
        HttpClient httpClient = new(new CancellationHandler());
        AzureRetailPricesCatalogClient retailPrices = new(
            () => httpClient,
            TimeProvider.System,
            logger: null);
        InfrastructureMonthlyUsdCostEstimator estimator = new(null);
        List<InfrastructureCostQueryNode> nodes =
        [
            new("AzureResource", "vm", RuntimePlatform.Vm, "eastus", "Standard_D2s_v3", 1),
        ];

        Func<Task> act = () => estimator.EstimateNodesAsync(
            nodes,
            attemptRetailPricing: true,
            retailPrices,
            CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private sealed class CancellationHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            _ = request;
            _ = cancellationToken;

            return Task.FromException<HttpResponseMessage>(
                new OperationCanceledException("Simulated pricing request cancellation."));
        }
    }
}
