using System.Net.Http;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Integrations;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Security;
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
    public async Task ProbeWithBodyAsync_treats_no_content_response_as_transport_success()
    {
        NoContentHandler handler = new();
        using HttpClient http = new(handler);
        OutboundWebhookDryRunService service = new(http);

        OutboundWebhookDryRunResult result = await service.ProbeWithBodyAsync(
            new Uri("https://example.com/webhook"),
            sharedSecret: null,
            OutboundWebhookDryRunService.BuildSyntheticFindingCreatedWebhookBodyUtf8(),
            CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue();
        result.StatusCode.Should().Be(204);
        result.ResponseBodyPreview.Should().BeEmpty();
        result.ResponseBodyTruncated.Should().BeFalse();
    }

    [SkippableFact]
    public async Task ProbeWithBodyAsync_preserves_status_code_when_response_body_read_fails()
    {
        ThrowingBodyHandler handler = new();
        using HttpClient http = new(handler);
        OutboundWebhookDryRunService service = new(http);

        OutboundWebhookDryRunResult result = await service.ProbeWithBodyAsync(
            new Uri("https://example.com/webhook"),
            sharedSecret: null,
            OutboundWebhookDryRunService.BuildSyntheticFindingCreatedWebhookBodyUtf8(),
            CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue();
        result.StatusCode.Should().Be(502);
        result.ResponseBodyPreview.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task ProbeWithBodyAsync_does_not_follow_redirect_to_loopback()
    {
        RedirectToLoopbackHandler handler = new(allowAutoRedirect: false);
        using HttpClient http = new(handler);
        OutboundWebhookDryRunService service = new(http);

        OutboundWebhookDryRunResult result = await service.ProbeWithBodyAsync(
            new Uri("https://example.com/webhook"),
            sharedSecret: null,
            OutboundWebhookDryRunService.BuildSyntheticFindingCreatedWebhookBodyUtf8(),
            CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue();
        result.StatusCode.Should().Be(302);
        handler.LoopbackHit.Should().BeFalse(
            "SSRF guard validates the operator URL only; probe must not auto-follow redirects to private targets.");
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

    [SkippableFact]
    public async Task ProbeWithBodyAsync_rejects_private_network_connect_endpoint_at_socket_connect()
    {
        using HttpClient http = CreateWebhookProbeHttpClientWithConnectGuard();
        OutboundWebhookDryRunService service = new(http);

        OutboundWebhookDryRunResult result = await service.ProbeWithBodyAsync(
            new Uri("https://127.0.0.1/webhook"),
            sharedSecret: null,
            OutboundWebhookDryRunService.BuildSyntheticFindingCreatedWebhookBodyUtf8(),
            CancellationToken.None);

        result.TransportSucceeded.Should().BeFalse();
        result.StatusCode.Should().Be(0);
        result.Error.Should().Contain("private network");
    }

    [SkippableFact]
    public async Task ProbeWithBodyAsync_succeeds_against_loopback_without_connect_guard()
    {
        CapturingHandler handler = new();
        using HttpClient http = new(handler);
        OutboundWebhookDryRunService service = new(http);

        OutboundWebhookDryRunResult result = await service.ProbeWithBodyAsync(
            new Uri("https://127.0.0.1/webhook"),
            sharedSecret: null,
            OutboundWebhookDryRunService.BuildSyntheticFindingCreatedWebhookBodyUtf8(),
            CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue(
            "HttpMessageHandler-based tests bypass socket connect and document the rebind gap closed by ConnectCallback.");
    }

    private static HttpClient CreateWebhookProbeHttpClientWithConnectGuard()
    {
        SocketsHttpHandler handler = new()
        {
            AllowAutoRedirect = false,
            ConnectCallback = OutboundHttpsConnectGuard.RejectPrivateNetworkAndConnectAsync
        };

        return new HttpClient(handler, disposeHandler: true)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
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

    private sealed class NoContentHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.NoContent) { Content = null });
    }

    private sealed class ThrowingBodyHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.BadGateway)
            {
                Content = new StreamContent(new ThrowingReadStream())
            });
    }

    private sealed class ThrowingReadStream : Stream
    {
        public override bool CanRead => true;

        public override bool CanSeek => false;

        public override bool CanWrite => false;

        public override long Length => throw new NotSupportedException();

        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override void Flush() => throw new NotSupportedException();

        public override int Read(byte[] buffer, int offset, int count) =>
            throw new IOException("simulated subscriber body read failure");

        public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            throw new IOException("simulated subscriber body read failure");

        public override ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default) =>
            throw new IOException("simulated subscriber body read failure");

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    }

    /// <summary>Simulates redirect-to-loopback behavior of <see cref="SocketsHttpHandler.AllowAutoRedirect" />.</summary>
    private sealed class RedirectToLoopbackHandler(bool allowAutoRedirect) : HttpMessageHandler
    {
        public bool LoopbackHit
        {
            get; private set;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Uri uri = request.RequestUri!;

            if (string.Equals(uri.Host, "127.0.0.1", StringComparison.Ordinal))
            {
                LoopbackHit = true;

                return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent("loopback")
                });
            }

            if (string.Equals(uri.Host, "example.com", StringComparison.OrdinalIgnoreCase))
            {
                if (allowAutoRedirect)
                {
                    LoopbackHit = true;

                    return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent("redirected-to-loopback")
                    });
                }

                HttpResponseMessage redirect = new(System.Net.HttpStatusCode.Redirect);
                redirect.Headers.Location = new Uri("https://127.0.0.1/webhook");

                return Task.FromResult(redirect);
            }

            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.NotFound));
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
