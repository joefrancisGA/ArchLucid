using System.Net;
using System.Text;

using ArchLucid.Application.Integrations.Itsm;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     INV-015 inbound ITSM webhook ordering against the real <see cref="WebApplicationFactory{Program}" /> pipeline.
/// </summary>
/// <remarks>
///     <para>
///         <b>Effective stage order (production-aligned host).</b> ASP.NET Core runs configured middleware (including the
///         rate limiter) before the controller action. Inside <c>ItsmInboundWebhooksController.Jira</c> / <c>ServiceNow</c>,
///         the implementation enforces: read body → measure UTF-8 bytes → <b>size cap</b> (reject before parse) →
///         <b>shared-secret / HMAC verify</b> → <c>JsonDocument.Parse</c> → handler dispatch. Rate limiting therefore
///         applies to requests that have already passed earlier global middleware but is still separate from controller
///         security gates; tests use a very high fixed-window permit count so a handful of requests stay far below 429.
///     </para>
///     <para>
///         <b>Payload-too-large status code.</b> The controller returns HTTP 400 with a validation problem detail (not 413)
///         when UTF-8 length exceeds <see cref="ItsmInboundWebhookSyncService.MaxInboundWebhookPayloadUtf8Bytes" />; the
///         structural invariant here is <i>rejection before JSON parse</i>, not a specific status code.
///     </para>
/// </remarks>
public sealed class InboundWebhookPipelineOrderIntegrationTests
{
    private const string JiraSecret = "integration-test-jira-webhook-secret";

    [Fact]
    public async Task Jira_webhook_rejects_utf8_oversize_payload_before_json_parse_with_400()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        string oversizeBody = new('a', ItsmInboundWebhookSyncService.MaxInboundWebhookPayloadUtf8Bytes + 1);

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/integrations/webhooks/jira");
        request.Content = new StringContent(oversizeBody, Encoding.UTF8, "application/json");

        request.Headers.TryAddWithoutValidation("X-Jira-Token", JiraSecret);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, "size cap must surface as client error before handler JSON work");

        string payload = await response.Content.ReadAsStringAsync();

        payload.IndexOf("payload exceeds", StringComparison.OrdinalIgnoreCase).Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task Jira_webhook_rejects_invalid_shared_secret_before_json_parse_with_401()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        string garbageThatWouldFailParse =
            """
            not-json-but-small
            """;

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/integrations/webhooks/jira");
        request.Content = new StringContent(garbageThatWouldFailParse, Encoding.UTF8, "application/json");

        request.Headers.TryAddWithoutValidation("X-Jira-Token", "wrong-secret");

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Unauthorized,
            "shared-secret verification must run before JsonDocument.Parse so malformed JSON never reaches the parser");

        string payload = await response.Content.ReadAsStringAsync();

        payload.IndexOf("JsonException", StringComparison.OrdinalIgnoreCase).Should().Be(-1);
    }

    private static WebApplicationFactory<Program> CreateFactory() =>
        new OpenApiContractWebAppFactory().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration(
                (_, config) =>
                    config.AddInMemoryCollection(
                        new Dictionary<string, string?>
                        {
                            ["Integrations:ItsmInbound:JiraWebhookSecret"] = JiraSecret,
                            ["Integrations:ItsmInbound:RequireBodyHmacSignature"] = "false",
                        })));
}
