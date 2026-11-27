using System.Net;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class Fnd065PricingOperationBudgetTests
{
    private static readonly TimeSpan ProbeBudget = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan TestWait = TimeSpan.FromSeconds(5);

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, false)]
    [InlineData(true, true)]
    [InlineData(false, true)]
    public async Task Pagination_and_body_read_share_a_deadline_and_preserve_caller_cancellation(bool azure, bool cancelCaller)
    {
        FakeTimeProvider clock = new();
        using CancellationTokenSource caller = new();
        using CatalogTransport transport = new(azure, clock);
        using HttpClient http = new(transport)
        {
            BaseAddress = new Uri(azure ? "https://prices.azure.com/" : "https://cloudbilling.googleapis.com/"),
            Timeout = ProbeBudget
        };
        Mock<IOptionsMonitor<GcpBillingCatalogOptions>> gcpOptions = new();
        gcpOptions.Setup(options => options.CurrentValue).Returns(new GcpBillingCatalogOptions { ApiKey = "fake" });

        Task<decimal?> pending = azure
            ? new AzureRetailPricesCatalogClient(() => http, clock, null)
                .TryGetConsumptionMonthlyUsdAsync("Virtual Machines", "eastus", "test", 1, caller.Token)
            : new GcpCloudBillingCatalogClient(() => http, gcpOptions.Object, clock, null)
                .TryGetComputeEngineMonthlyUsdAsync("test", 1, caller.Token);

        await transport.LastPageStarted.Task.WaitAsync(TestWait);

        if (cancelCaller)
        {
            await caller.CancelAsync();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pending.WaitAsync(TestWait));
        }
        else
        {
            clock.Advance(TimeSpan.FromSeconds(3));
            Assert.False(pending.IsCompleted);
            clock.Advance(TimeSpan.FromSeconds(1));
            Assert.Null(await pending.WaitAsync(TestWait));
        }

        Assert.Equal(2, transport.Sends);
    }

    private sealed class CatalogTransport(bool azure, FakeTimeProvider clock) : HttpMessageHandler
    {
        public TaskCompletionSource LastPageStarted { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public int Sends { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Assert.Equal(azure ? "prices.azure.com" : "cloudbilling.googleapis.com", request.RequestUri?.Host);
            Sends++;

            if (Sends == 1)
            {
                clock.Advance(TimeSpan.FromSeconds(16));
                string json = azure
                    ? """{"Items":[],"NextPageLink":"https://prices.azure.com/api/retail/prices?$skip=1"}"""
                    : """{"skus":[],"nextPageToken":"next"}""";

                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
            }

            Task wait = Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            LastPageStarted.SetResult();
            await wait;

            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }
}
