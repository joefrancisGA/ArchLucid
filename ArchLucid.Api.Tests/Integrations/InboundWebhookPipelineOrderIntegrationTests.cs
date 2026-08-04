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
///         <b>Payload-too-large status code.</b> TB-967 returns HTTP 413 (<c>RequestPayloadTooLarge</c>) when the body
///         exceeds <see cref="ItsmInboundWebhookSyncService.MaxInboundWebhookPayloadUtf8Bytes" /> before verify/parse.
///     </para>
/// </remarks>
[Trait("Category", "Integration")]
public sealed class InboundWebhookPipelineOrderIntegrationTests
{
    private const string JiraSecret = "integration-test-jira-webhook-secret";

    [Fact]
    public async Task Jira_webhook_rejects_utf8_oversize_payload_before_json_parse_with_413()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        string oversizeBody = new('a', ItsmInboundWebhookSyncService.MaxInboundWebhookPayloadUtf8Bytes + 1);

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/integrations/webhooks/jira");
        request.Content = new StringContent(oversizeBody, Encoding.UTF8, "application/json");

        request.Headers.TryAddWithoutValidation("X-Jira-Token", JiraSecret);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(
            HttpStatusCode.RequestEntityTooLarge,
            "bounded intake must reject oversize before verify/parse (TB-967)");

        string payload = await response.Content.ReadAsStringAsync();

        payload.IndexOf("payload exceeds", StringComparison.OrdinalIgnoreCase).Should().BeGreaterThanOrEqualTo(0);
        payload.IndexOf("JsonException", StringComparison.OrdinalIgnoreCase).Should().Be(-1);
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

    [Fact]
    public async Task Jira_webhook_response_echoes_trimmed_x_correlation_id_header()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/integrations/webhooks/jira");
        request.Content = new StringContent("{}", Encoding.UTF8, "application/json");

        request.Headers.TryAddWithoutValidation("X-Jira-Token", "wrong-secret");
        request.Headers.TryAddWithoutValidation("X-Correlation-ID", "  inbound-it-sm-corr-hdr-1  ");

        using HttpResponseMessage response = await client.SendAsync(request);

        IEnumerable<string>? correlationHeaders =
            response.Headers.TryGetValues("X-Correlation-ID", out IEnumerable<string>? values)
                ? values
                : null;

        correlationHeaders.Should().NotBeNull();
        correlationHeaders!.Should().ContainSingle().Which.Should().Be("inbound-it-sm-corr-hdr-1");
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
