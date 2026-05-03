using System.Net;

using ArchLucid.Host.Core.Services.Delivery;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Tests.Services.Delivery;

/// <summary>Validates Polly wired on the named webhook HTTP client retries transient 503 responses.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WebhookOutboundHttpRetryPolicyTests
{
    [Fact]
    public async Task Named_webhook_client_retries_after_two_503_then_200()
    {
        Sequential503ThenOkHandler primary = new();

        ServiceCollection services = new();

        services.AddLogging(static b => b.SetMinimumLevel(LogLevel.None));

        services
            .AddHttpClient(HttpWebhookPoster.WebhookHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => primary)
            .AddPolicyHandler(static (_, _) => WebhookOutboundHttpRetryPolicy.Create(static _ => TimeSpan.Zero));

        await using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory? factory = provider.GetService<IHttpClientFactory>();

        factory.Should().NotBeNull();

        using HttpClient http = factory!.CreateClient(HttpWebhookPoster.WebhookHttpClientName);

        using HttpResponseMessage response =
            await http.PostAsync(new Uri("https://archlucid.test/webhook-hook"), new StringContent("{}"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        primary.SendCount.Should().Be(3);
    }

    /// <remarks>Mocks transport; Polly observes status codes returned by SendAsync.</remarks>
    private sealed class Sequential503ThenOkHandler : HttpMessageHandler
    {
        public int SendCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            SendCount++;

            HttpStatusCode status = SendCount switch
            {
                1 => HttpStatusCode.ServiceUnavailable,
                2 => HttpStatusCode.ServiceUnavailable,
                _ => HttpStatusCode.OK,
            };

            return Task.FromResult(new HttpResponseMessage(status));
        }
    }
}
