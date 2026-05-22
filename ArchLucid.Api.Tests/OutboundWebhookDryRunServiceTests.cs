using System.Text.Json;

using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboundWebhookDryRunServiceTests
{
    [SkippableFact]
    public void BuildAuthorityRunCompletedWebhookBodyUtf8_uses_authority_run_completed_event_type()
    {
        byte[] body = OutboundWebhookDryRunService.BuildAuthorityRunCompletedWebhookBodyUtf8();
        string json = System.Text.Encoding.UTF8.GetString(body);

        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("type").GetString()
            .Should().Be(IntegrationEventTypes.AuthorityRunCompletedV1);

        JsonElement data = doc.RootElement.GetProperty("data");
        data.GetProperty("schemaVersion").GetInt32().Should().Be(1);
        data.GetProperty("runId").GetGuid().Should().NotBe(Guid.Empty);
        data.GetProperty("findings").GetArrayLength().Should().BeGreaterThan(0);
    }

    [SkippableFact]
    public async Task ProbeAuthorityRunCompletedAsync_dispatches_payload_and_returns_response()
    {
        CapturingHandler handler = new();
        using HttpClient http = new(handler);
        OutboundWebhookDryRunService service = new(http);

        Uri target = new("https://example.test/webhook");
        OutboundWebhookDryRunResult result =
            await service.ProbeAuthorityRunCompletedAsync(target, sharedSecret: null, CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue();
        result.StatusCode.Should().Be(200);
        handler.LastBodyUtf8.Should().NotBeNullOrEmpty();

        using JsonDocument doc = JsonDocument.Parse(System.Text.Encoding.UTF8.GetString(handler.LastBodyUtf8!));
        doc.RootElement.GetProperty("type").GetString()
            .Should().Be(IntegrationEventTypes.AuthorityRunCompletedV1);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public byte[]? LastBodyUtf8
        {
            get; private set;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (request.Content is not null)
                LastBodyUtf8 = await request.Content.ReadAsByteArrayAsync(cancellationToken);

            return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent("{\"ok\":true}")
            };
        }
    }
}
