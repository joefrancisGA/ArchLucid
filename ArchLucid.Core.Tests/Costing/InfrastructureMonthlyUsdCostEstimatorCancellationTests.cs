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
    public async Task EstimateNodesAsync_cancels_an_in_flight_pricing_request_when_the_caller_cancels()
    {
        using CancellationTokenSource caller = new();
        using WaitingPricingHandler handler = new();
        using HttpClient httpClient = new(handler, disposeHandler: false);
        AzureRetailPricesCatalogClient retailPrices = new(() => httpClient, TimeProvider.System, logger: null);
        InfrastructureMonthlyUsdCostEstimator estimator = new(null);

        Task<InfrastructureCostEstimateTotals> pending = estimator.EstimateNodesAsync(
            [new("AzureResource", "vm", RuntimePlatform.Vm, "eastus", "Standard_D2s_v3", 1)],
            attemptRetailPricing: true, retailPrices, caller.Token);

        TimeSpan timeout = TimeSpan.FromSeconds(10);
        CancellationToken requestToken = await handler.Started.Task.WaitAsync(timeout);
        pending.IsCompleted.Should().BeFalse();

        caller.Cancel();

        Func<Task> awaitEstimate = () => pending.WaitAsync(timeout);
        await awaitEstimate.Should().ThrowAsync<OperationCanceledException>();
        requestToken.IsCancellationRequested.Should().BeTrue();
    }

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

    private sealed class WaitingPricingHandler : HttpMessageHandler
    {
        public TaskCompletionSource<CancellationToken> Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Started.TrySetResult(cancellationToken);
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            throw new InvalidOperationException("The pending request should only end by cancellation.");
        }
    }
}
