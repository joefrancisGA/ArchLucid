using System.Net;

using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Notifications;
using ArchLucid.Persistence.Billing.AzureMarketplace;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboundDeliveryIsolationTests
{
    private const string WebhookUrl = "https://webhook.invalid/delivery";
    private static readonly Uri MarketplaceActivationUri = new("https://marketplace.invalid/subscriptions/test/activate");

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task An_open_delivery_breaker_does_not_block_the_other_named_client(bool webhookFails)
    {
        RecordingDeliveryTransport webhook = new(webhookFails ? HttpStatusCode.ServiceUnavailable : HttpStatusCode.OK);
        RecordingDeliveryTransport marketplace = new(webhookFails ? HttpStatusCode.OK : HttpStatusCode.ServiceUnavailable);

        using ServiceProvider provider = BuildProductionRegistrations(webhook, marketplace);
        IWebhookPoster poster = provider.GetRequiredService<IWebhookPoster>();
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>()
            .CreateClient(nameof(AzureMarketplaceBillingProvider));

        Func<Task> sendWebhook = () => poster.PostJsonAsync(WebhookUrl, new { Message = "synthetic" }, CancellationToken.None);
        Func<Task> sendMarketplace = () => SendMarketplaceActivationAsync(client);
        Func<Task> sendFailing = webhookFails ? sendWebhook : sendMarketplace;
        Func<Task> sendHealthy = webhookFails ? sendMarketplace : sendWebhook;

        for (int index = 0; index < 2; index++)
        {
            HttpRequestException failure = await Assert.ThrowsAsync<HttpRequestException>(sendFailing);

            Assert.Equal(HttpStatusCode.ServiceUnavailable, failure.StatusCode);
        }

        await Assert.ThrowsAnyAsync<BrokenCircuitException>(sendFailing);
        await sendHealthy();

        Assert.Equal(webhookFails ? 2 : 1, webhook.SendCount);
        Assert.Equal(webhookFails ? 1 : 2, marketplace.SendCount);
    }

    private static async Task SendMarketplaceActivationAsync(HttpClient client)
    {
        using HttpResponseMessage response =
            await client.PostAsync(MarketplaceActivationUri, content: null, CancellationToken.None);

        response.EnsureSuccessStatusCode();
    }

    private static ServiceProvider BuildProductionRegistrations(
        RecordingDeliveryTransport webhook,
        RecordingDeliveryTransport marketplace)
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();
        ServiceCollection services = [];
        services.AddLogging();
        services.Configure<OutboundExternalHttpResilienceOptions>(static options =>
        {
            options.MaxRetryAttempts = 0;
            options.MinimumThroughput = 2;
            options.FailureRatio = 1;
        });
        AdvisoryDigestSchedulingRegistrar.RegisterDigestDelivery(services, configuration);
        ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions.RegisterBilling(services, configuration);
        services.PostConfigure<WebhookDeliveryOptions>(static options => options.UseHttpClient = true);

        services.AddHttpClient(HttpWebhookPoster.WebhookHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => webhook);
        services.AddHttpClient(nameof(AzureMarketplaceBillingProvider))
            .ConfigurePrimaryHttpMessageHandler(() => marketplace);

        return services.BuildServiceProvider();
    }

    private sealed class RecordingDeliveryTransport(HttpStatusCode responseStatus) : HttpMessageHandler
    {
        public int SendCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Assert.Equal(HttpMethod.Post, request.Method);
            Uri uri = Assert.IsType<Uri>(request.RequestUri);
            Assert.EndsWith(".invalid", uri.Host);

            SendCount++;

            return Task.FromResult(new HttpResponseMessage(responseStatus));
        }
    }
}
