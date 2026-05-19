using System.Net;
using System.Text;

using ArchLucid.Host.Core.Services.Delivery;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     HTTP coverage for inbound ITSM webhook HMAC verification when
///     <c>Integrations:ItsmInbound:RequireBodyHmacSignature</c> is enabled.
/// </summary>
/// <remarks>
///     Payload bytes reuse the CloudEvents governance-approval example from
///     <c>docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md</c> (integration-events HEC section).
/// </remarks>
[Trait("Category", "Integration")]
public sealed class InboundWebhookHmacSignatureIntegrationTests
{
    private const string JiraSecret = "integration-test-jira-webhook-hmac-secret";

    /// <summary>
    ///     Minified CloudEvents envelope from INTEGRATION_EVENTS_AND_WEBHOOKS.md (governance.approval.submitted).
    /// </summary>
    private const string CanonicalIntegrationEventsBody =
        """
        {"specversion":"1.0","type":"com.archlucid.governance.approval.submitted","source":"/archlucid/tenant/11111111-1111-1111-1111-111111111111","id":"a0d3c4d2-5c2b-4c2b-9c2b-000000000001","time":"2026-05-01T12:00:00Z","datacontenttype":"application/json","data":{"schemaVersion":1,"approvalRequestId":"AR-1001","runId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","manifestVersion":"v1.0.0","tenantId":"11111111-1111-1111-1111-111111111111","workspaceId":"22222222-2222-2222-2222-222222222222","projectId":"33333333-3333-3333-3333-333333333333","sourceEnvironment":"dev","targetEnvironment":"prod","requestedBy":"jdoe@contoso.com"}}
        """;

    [Fact]
    public async Task Jira_post_missing_webhook_signature_returns_401_when_hmac_required()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        using HttpRequestMessage request = CreateJiraPost(CanonicalIntegrationEventsBody);
        request.Headers.TryAddWithoutValidation("X-Jira-Token", JiraSecret);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Jira_post_wrong_webhook_signature_returns_401()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        using HttpRequestMessage request = CreateJiraPost(CanonicalIntegrationEventsBody);
        request.Headers.TryAddWithoutValidation("X-Jira-Token", JiraSecret);
        request.Headers.TryAddWithoutValidation(WebhookSignature.HeaderName, WebhookSignature.Prefix + "00".PadRight(64, '0'));

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Jira_post_missing_jira_token_returns_401_even_with_valid_hmac()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        using HttpRequestMessage request = CreateJiraPost(CanonicalIntegrationEventsBody);
        AddValidWebhookSignature(request, CanonicalIntegrationEventsBody);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Jira_post_valid_webhook_signature_and_token_passes_hmac_gate()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        using HttpRequestMessage request = CreateJiraPost(CanonicalIntegrationEventsBody);
        request.Headers.TryAddWithoutValidation("X-Jira-Token", JiraSecret);
        AddValidWebhookSignature(request, CanonicalIntegrationEventsBody);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized, "HMAC and shared-secret checks must succeed before handler validation");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, "canonical integration-event envelope is not a Jira issue webhook shape");
    }

    [Fact]
    public async Task Jira_post_legacy_x_archlucid_signature_raw_hex_still_accepted()
    {
        await using WebApplicationFactory<Program> factory = CreateFactory();
        using HttpClient client = factory.CreateClient();

        const string body = """{"issue":{"key":"PROJ-1"}}""";

        using HttpRequestMessage request = CreateJiraPost(body);
        request.Headers.TryAddWithoutValidation("X-Jira-Token", JiraSecret);

        byte[] utf8 = Encoding.UTF8.GetBytes(body);
        string hex = WebhookSignature.ComputeSha256Hex(JiraSecret, utf8);

        request.Headers.TryAddWithoutValidation("X-ArchLucid-Signature", hex);

        using HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
    }

    private static void AddValidWebhookSignature(HttpRequestMessage request, string body)
    {
        byte[] utf8 = Encoding.UTF8.GetBytes(body);
        string hex = WebhookSignature.ComputeSha256Hex(JiraSecret, utf8);

        request.Headers.TryAddWithoutValidation(WebhookSignature.HeaderName, WebhookSignature.Prefix + hex);
    }

    private static HttpRequestMessage CreateJiraPost(string body) =>
        new(HttpMethod.Post, "/v1/integrations/webhooks/jira")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

    private static WebApplicationFactory<Program> CreateFactory() =>
        new OpenApiContractWebAppFactory().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration(
                (_, config) =>
                    config.AddInMemoryCollection(
                        new Dictionary<string, string?>
                        {
                            ["Integrations:ItsmInbound:JiraWebhookSecret"] = JiraSecret,
                            ["Integrations:ItsmInbound:RequireBodyHmacSignature"] = "true",
                            ["Integrations:ItsmInbound:WebhookTimestampSkewSeconds"] = "0",
                        })));
}
