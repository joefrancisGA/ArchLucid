using System.Net;

using ArchLucid.Core.Http;
using ArchLucid.Persistence.Billing.AzureMarketplace;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MarketplaceActivationHttpResilienceTests
{
    private static readonly Uri SubscriptionUri = new("https://marketplace.invalid/subscription");

    [Fact]
    public async Task Activation_never_retries_and_an_open_write_breaker_does_not_block_status_reads()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();
        ServiceCollection services = [];
        services.Configure<OutboundExternalHttpResilienceOptions>(static options =>
        {
            options.MaxRetryAttempts = 1;
            options.MinimumThroughput = 2;
            options.FailureRatio = 1;
        });
        ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions.RegisterBilling(services, configuration);
        CountingTransport activation = new(HttpMethod.Post, HttpStatusCode.ServiceUnavailable, HttpStatusCode.ServiceUnavailable);
        CountingTransport status = new(HttpMethod.Get, HttpStatusCode.ServiceUnavailable, HttpStatusCode.OK);
        services.AddHttpClient(nameof(AzureMarketplaceBillingProvider))
            .ConfigurePrimaryHttpMessageHandler(() => activation);
        services.AddHttpClient(AzureMarketplaceBillingProvider.ActivationStatusHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => status);
        using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();
        using HttpClient writeClient = factory.CreateClient(nameof(AzureMarketplaceBillingProvider));
        using HttpClient readClient = factory.CreateClient(AzureMarketplaceBillingProvider.ActivationStatusHttpClientName);

        using HttpResponseMessage first = await writeClient.PostAsync(SubscriptionUri, null);
        using HttpResponseMessage second = await writeClient.PostAsync(SubscriptionUri, null);
        await Assert.ThrowsAnyAsync<BrokenCircuitException>(() => writeClient.PostAsync(SubscriptionUri, null));
        using HttpResponseMessage result = await readClient.GetAsync(SubscriptionUri);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, first.StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, second.StatusCode);
        Assert.Equal(2, activation.SendCount);
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        Assert.Equal(2, status.SendCount);
    }

    [Theory]
    [InlineData(nameof(AzureMarketplaceBillingProvider))]
    [InlineData(AzureMarketplaceBillingProvider.ActivationStatusHttpClientName)]
    public void Marketplace_clients_do_not_follow_redirects(string clientName)
    {
        ServiceCollection services = [];
        ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions.RegisterBilling(
            services, new ConfigurationBuilder().Build());
        using ServiceProvider provider = services.BuildServiceProvider();
        HttpMessageHandler primary = provider.GetRequiredService<IHttpMessageHandlerFactory>().CreateHandler(clientName);
        while (primary is DelegatingHandler { InnerHandler: { } inner })
            primary = inner;

        Assert.False(Assert.IsType<SocketsHttpHandler>(primary).AllowAutoRedirect);
    }

    private sealed class CountingTransport(HttpMethod method, params HttpStatusCode[] outcomes) : HttpMessageHandler
    {
        public int SendCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Assert.Equal(method, request.Method);

            return Task.FromResult(new HttpResponseMessage(outcomes[SendCount++]));
        }
    }
}
