using System.Net;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Http;

using Microsoft.Extensions.DependencyInjection;

using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmOutboundHealthClientIsolationTests
{
    private static readonly Uri ProbeUri = new("https://provider.example/health");

    [Theory]
    [InlineData(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName, ItsmOutboundIntegrationHealthLimits.ServiceNowHttpClientName)]
    [InlineData(ItsmOutboundIntegrationHealthLimits.ServiceNowHttpClientName, ItsmOutboundIntegrationHealthLimits.JiraHttpClientName)]
    public async Task A_throttled_provider_does_not_open_the_other_providers_health_circuit(string throttledName, string healthyName)
    {
        ServiceCollection services = [];
        services.AddOptions<OutboundExternalHttpResilienceOptions>().Configure(static options =>
        {
            options.FailureRatio = 1;
            options.MinimumThroughput = 2;
            options.MaxRetryAttempts = 0;
        });

        global::ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions.RegisterItsmOutboundHealthHttpClients(services);
        CountingHandler throttledHandler = new(HttpStatusCode.TooManyRequests);
        CountingHandler healthyHandler = new(HttpStatusCode.OK);
        services.AddHttpClient(throttledName).ConfigurePrimaryHttpMessageHandler(() => throttledHandler);
        services.AddHttpClient(healthyName).ConfigurePrimaryHttpMessageHandler(() => healthyHandler);

        await using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();
        using HttpClient throttled = factory.CreateClient(throttledName);
        using HttpClient healthy = factory.CreateClient(healthyName);
        TimeSpan expectedTimeout = TimeSpan.FromSeconds(ItsmOutboundIntegrationHealthLimits.NetworkTimeoutSeconds);
        Assert.Equal(expectedTimeout, throttled.Timeout);
        Assert.Equal(expectedTimeout, healthy.Timeout);

        for (int i = 0; i < 2; i++)
        {
            using HttpResponseMessage failure = await throttled.GetAsync(ProbeUri);
            Assert.Equal(HttpStatusCode.TooManyRequests, failure.StatusCode);
        }

        await Assert.ThrowsAnyAsync<BrokenCircuitException>(() => throttled.GetAsync(ProbeUri));
        Assert.Equal(2, throttledHandler.Sends);

        using HttpResponseMessage response = await healthy.GetAsync(ProbeUri);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(1, healthyHandler.Sends);
    }

    private sealed class CountingHandler(HttpStatusCode responseStatus) : HttpMessageHandler
    {
        public int Sends { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Sends++;
            return Task.FromResult(new HttpResponseMessage(responseStatus));
        }
    }
}
