using System.Net;

using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Notifications;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Polly;
using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WebhookDestinationResilienceTests
{
    [Fact]
    public async Task A_failed_webhook_destination_does_not_block_a_different_path_on_the_same_host()
    {
        const string failed = "https://hooks.invalid/failed";
        const string healthy = "https://hooks.invalid/healthy";
        IConfiguration configuration = new ConfigurationBuilder().Build();
        ServiceCollection services = [];
        services.AddLogging();
        services.Configure<OutboundExternalHttpResilienceOptions>(static options =>
        {
            options.MaxRetryAttempts = 0;
            options.FailureRatio = 1;
            options.MinimumThroughput = 2;
        });
        AdvisoryDigestSchedulingRegistrar.RegisterDigestDelivery(services, configuration);
        services.PostConfigure<WebhookDeliveryOptions>(static options => options.UseHttpClient = true);
        WebhookTransport transport = new();
        services.AddHttpClient(HttpWebhookPoster.WebhookHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => transport);
        using ServiceProvider provider = services.BuildServiceProvider();
        IWebhookPoster poster = provider.GetRequiredService<IWebhookPoster>();

        for (int index = 0; index < 2; index++)
        {
            HttpRequestException failure = await Assert.ThrowsAsync<HttpRequestException>(() =>
                poster.PostJsonAsync(failed, new { Example = true }, CancellationToken.None));
            Assert.Equal(HttpStatusCode.ServiceUnavailable, failure.StatusCode);
        }

        await Assert.ThrowsAnyAsync<BrokenCircuitException>(() =>
            poster.PostJsonAsync(failed, new { Example = true }, CancellationToken.None));
        await poster.PostJsonAsync(healthy, new { Example = true }, CancellationToken.None);

        Assert.Equal(2, transport.FailedSends);
        Assert.Equal(1, transport.HealthySends);
    }

    [Fact]
    public void Full_registry_preserves_recent_state_and_reclaims_only_idle_partitions()
    {
        FakeTimeProvider clock = new();
        WebhookDestinationResiliencePolicies registry = new(
            Options.Create(new OutboundExternalHttpResilienceOptions()), clock, capacity: 1);
        using HttpRequestMessage first = new(HttpMethod.Post, "https://hooks.invalid/action?channel=one");
        using HttpRequestMessage equivalent = new(HttpMethod.Post, "https://HOOKS.invalid:443/action?channel=one#fragment");
        using HttpRequestMessage second = new(HttpMethod.Post, "https://hooks.invalid/action?channel=two");

        IAsyncPolicy<HttpResponseMessage> initial = registry.ForRequest(first);
        Assert.Same(initial, registry.ForRequest(equivalent));
        Assert.Throws<HttpRequestException>(() => registry.ForRequest(second));
        clock.Advance(TimeSpan.FromSeconds(149));
        Assert.Throws<HttpRequestException>(() => registry.ForRequest(second));
        Assert.Same(initial, registry.ForRequest(first));
        clock.Advance(TimeSpan.FromSeconds(151));
        Assert.NotSame(initial, registry.ForRequest(second));
        Assert.Throws<HttpRequestException>(() => registry.ForRequest(first));
    }

    [Fact]
    public async Task Concurrent_calls_to_one_destination_share_one_policy()
    {
        WebhookDestinationResiliencePolicies registry = new(
            Options.Create(new OutboundExternalHttpResilienceOptions()), TimeProvider.System, capacity: 1);
        TaskCompletionSource start = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<IAsyncPolicy<HttpResponseMessage>>[] calls = Enumerable.Range(0, 16)
            .Select(async _ =>
            {
                await start.Task;
                using HttpRequestMessage request = new(HttpMethod.Post, "https://hooks.invalid/delivery");

                return registry.ForRequest(request);
            })
            .ToArray();

        start.SetResult();
        IAsyncPolicy<HttpResponseMessage>[] results = await Task.WhenAll(calls);
        Assert.All(results, policy => Assert.Same(results[0], policy));
    }

    private sealed class WebhookTransport : HttpMessageHandler
    {
        public int HealthySends { get; private set; }
        public int FailedSends { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri?.AbsolutePath == "/failed")
            {
                FailedSends++;

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
            }

            Assert.Equal("/healthy", request.RequestUri?.AbsolutePath);
            HealthySends++;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }
}
