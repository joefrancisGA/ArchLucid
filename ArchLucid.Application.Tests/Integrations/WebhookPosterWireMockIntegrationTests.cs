using System.Net.Http;

using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Notifications;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using WireMock;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;

namespace ArchLucid.Application.Tests.Integrations;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class WebhookPosterWireMockIntegrationTests
{
    [Fact]
    public async Task HttpWebhookPoster_posts_json_body_to_mock_server()
    {
        using WireMockServer server = WireMockServer.Start();
        server
            .Given(Request.Create().WithPath("/hook").UsingPost())
            .RespondWith(Response.Create().WithStatusCode(200));

        ServiceCollection services = new();
        services.AddLogging(b => b.AddProvider(NullLoggerProvider.Instance));
        services.AddHttpClient(HttpWebhookPoster.WebhookHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler());
        services.AddSingleton<IWebhookPoster>(sp => new HttpWebhookPoster(
            sp.GetRequiredService<ILogger<HttpWebhookPoster>>(),
            sp.GetRequiredService<IHttpClientFactory>()));

        await using ServiceProvider provider = services.BuildServiceProvider();
        IWebhookPoster poster = provider.GetRequiredService<IWebhookPoster>();

        object payload = new { schema = "com.archlucid.probe", n = 1 };
        string url = server.Url!.TrimEnd('/') + "/hook";

        Func<Task> act = async () => await poster.PostJsonAsync(url, payload, CancellationToken.None);

        await act.Should().NotThrowAsync();

        server.LogEntries.Should().HaveCount(1);
        string body = server.LogEntries.Single().RequestMessage!.Body!;
        body.Should().Contain("\"schema\":\"com.archlucid.probe\"");
        body.Should().Contain("\"n\":1");
    }
}
