using System.Net;
using System.Net.Http;
using System.Text;

using ArchLucid.Application.Tests.Integration;
using ArchLucid.Application.Tests.Integrations.Itsm.Outbound;
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

/// <summary>
///     Outbound webhook dispatch is implemented by <see cref="HttpWebhookPoster" /> (<see cref="IWebhookPoster" />). The
///     assessment item names a notional “WebhookDispatchService”; this suite targets that behavior in-process with
///     WireMock (localhost only; no external network).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class WebhookPosterWireMockIntegrationTests
{
    private const string ProbePayloadSchemaJson =
        """
        {
          "type": "object",
          "required": ["schema", "eventType", "n"],
          "properties": {
            "schema": { "type": "string", "const": "com.archlucid.probe" },
            "eventType": { "type": "string", "minLength": 1 },
            "n": { "type": "integer", "minimum": 1 }
          },
          "additionalProperties": false
        }
        """;

    [Fact]
    public async Task HttpWebhookPoster_dispatch_posts_expected_json_schema_and_content_type()
    {
        using WireMockServer server = WireMockServer.Start();
        server
            .Given(Request.Create().WithPath("/hook").UsingPost())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.OK));

        await using ServiceProvider provider = BuildServiceProvider();
        IWebhookPoster poster = provider.GetRequiredService<IWebhookPoster>();

        object payload = new
        {
            schema = "com.archlucid.probe",
            eventType = "ArchLucid.WebhookProbe",
            n = 1,
        };

        string url = server.Url!.TrimEnd('/') + "/hook";

        await poster.PostJsonAsync(url, payload, CancellationToken.None);

        IRequestMessage captured = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesHookPost);

        string? contentType = ItsmOutboundWireMockAssertions.TryReadFirstHeaderValue(captured.Headers, "Content-Type");
        ItsmOutboundWireMockAssertions.AssertContentTypeLooksLikeJson(contentType);
        contentType!.ToLowerInvariant().Should().Contain("utf");

        string body = captured.Body ?? string.Empty;
        body.Should().NotBeNullOrWhiteSpace();

        IntegrationEventJsonSchemaAssert.PayloadTextValidatesInlineSchema(
            ProbePayloadSchemaJson,
            body,
            "webhook probe POST");
    }

    [Fact]
    public async Task HttpWebhookPoster_dispatch_sends_hmac_signature_when_secret_configured()
    {
        using WireMockServer server = WireMockServer.Start();
        server
            .Given(Request.Create().WithPath("/hook").UsingPost())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.OK));

        await using ServiceProvider provider = BuildServiceProvider();
        IWebhookPoster poster = provider.GetRequiredService<IWebhookPoster>();

        object payload = new
        {
            schema = "com.archlucid.probe",
            eventType = "ArchLucid.WebhookProbe",
            n = 1,
        };

        string url = server.Url!.TrimEnd('/') + "/hook";
        const string secret = "wiremock-test-hmac-secret";

        WebhookPostOptions options = new()
        {
            HmacSha256SharedSecret = secret,
            EventType = "ArchLucid.WebhookProbe",
        };

        await poster.PostJsonAsync(url, payload, CancellationToken.None, options);

        IRequestMessage captured = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesHookPost);
        string body = captured.Body ?? string.Empty;
        byte[] utf8 = Encoding.UTF8.GetBytes(body);
        string expected = WebhookSignature.Prefix + WebhookSignature.ComputeSha256Hex(secret, utf8);

        string? signature = ItsmOutboundWireMockAssertions.TryReadFirstHeaderValue(captured.Headers, WebhookSignature.HeaderName);

        signature.Should().Be(expected);
    }

    private static bool MatchesHookPost(IRequestMessage message)
    {
        return HttpMethod.Post.Method.Equals(message.Method, StringComparison.OrdinalIgnoreCase)
               && message.AbsolutePath.Equals("/hook", StringComparison.Ordinal);
    }

    private static ServiceProvider BuildServiceProvider()
    {
        ServiceCollection services = new();
        services.AddLogging(b => b.AddProvider(NullLoggerProvider.Instance));
        services.AddHttpClient(HttpWebhookPoster.WebhookHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler());
        services.AddSingleton<IWebhookPoster>(static sp =>
            new HttpWebhookPoster(
                sp.GetRequiredService<ILogger<HttpWebhookPoster>>(),
                sp.GetRequiredService<IHttpClientFactory>()));

        return services.BuildServiceProvider();
    }
}
