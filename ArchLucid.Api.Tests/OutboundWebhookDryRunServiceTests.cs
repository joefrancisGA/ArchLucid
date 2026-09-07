using System.Text;
using System.Text.Json;

using ArchLucid.Application.Integrations;
using ArchLucid.Core.Integration;
using ArchLucid.Host.Composition.Services;
using ArchLucid.Host.Core.Services.Delivery;

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

        Uri target = new("https://example.com/webhook");
        OutboundWebhookDryRunResult result =
            await service.ProbeAuthorityRunCompletedAsync(target, sharedSecret: null, CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue();
        result.StatusCode.Should().Be(200);
        handler.LastBodyUtf8.Should().NotBeNullOrEmpty();

        using JsonDocument doc = JsonDocument.Parse(System.Text.Encoding.UTF8.GetString(handler.LastBodyUtf8!));
        doc.RootElement.GetProperty("type").GetString()
            .Should().Be(IntegrationEventTypes.AuthorityRunCompletedV1);
    }

    [SkippableFact]
    public async Task ProbeWithBodyAsync_does_not_read_entire_oversized_subscriber_response()
    {
        const int oversizedChars = OutboundWebhookDryRunService.PreviewMaxChars + 50_000;
        OversizedResponseHandler handler = new(oversizedChars);
        using HttpClient http = new(handler);
        OutboundWebhookDryRunService service = new(http);

        OutboundWebhookDryRunResult result = await service.ProbeWithBodyAsync(
            new Uri("https://example.com/webhook"),
            sharedSecret: null,
            OutboundWebhookDryRunService.BuildSyntheticFindingCreatedWebhookBodyUtf8(),
            CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue();
        result.ResponseBodyTruncated.Should().BeTrue();
        result.ResponseBodyPreview.Should().HaveLength(OutboundWebhookDryRunService.PreviewMaxChars);
        handler.BytesRead.Should().BeLessThan(oversizedChars);
    }

    [SkippableFact]
    public async Task ProbeWithBodyAsync_omits_signature_header_when_shared_secret_is_whitespace_only()
    {
        CapturingHandler handler = new();
        using HttpClient http = new(handler);
        OutboundWebhookDryRunService service = new(http);

        await service.ProbeWithBodyAsync(
            new Uri("https://example.com/webhook"),
            sharedSecret: "   ",
            OutboundWebhookDryRunService.BuildSyntheticFindingCreatedWebhookBodyUtf8(),
            CancellationToken.None);

        handler.LastRequest.Should().NotBeNull();
        handler.LastRequest!.Headers.Contains(WebhookSignature.HeaderName).Should().BeFalse();
    }

    private sealed class OversizedResponseHandler(int totalChars) : HttpMessageHandler
    {
        public long BytesRead
        {
            get; private set;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            byte[] payload = Encoding.UTF8.GetBytes(new string('x', totalChars));
            TrackingStream stream = new(payload, bytesRead => BytesRead = bytesRead);

            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StreamContent(stream)
            });
        }
    }

    private sealed class TrackingStream(byte[] payload, Action<long> onBytesRead) : MemoryStream(payload)
    {
        public override int Read(byte[] buffer, int offset, int count)
        {
            int read = base.Read(buffer, offset, count);
            onBytesRead(Position);

            return read;
        }

        public override ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default)
        {
            return ReadAsyncCore(buffer, cancellationToken);
        }

        private async ValueTask<int> ReadAsyncCore(Memory<byte> buffer, CancellationToken cancellationToken)
        {
            int read = await base.ReadAsync(buffer, cancellationToken).ConfigureAwait(false);
            onBytesRead(Position);

            return read;
        }
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public byte[]? LastBodyUtf8
        {
            get; private set;
        }

        public HttpRequestMessage? LastRequest
        {
            get; private set;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            LastRequest = request;

            if (request.Content is not null)
                LastBodyUtf8 = await request.Content.ReadAsByteArrayAsync(cancellationToken);

            return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent("{\"ok\":true}")
            };
        }
    }
}
