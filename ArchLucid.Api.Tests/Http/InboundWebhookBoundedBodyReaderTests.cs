using System.Text;

using ArchLucid.Api.Http;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests.Http;

[Trait("Suite", "Core")]
public sealed class InboundWebhookBoundedBodyReaderTests
{
    [Fact]
    public async Task ReadUtf8Async_rejects_declared_ContentLength_over_max_without_consuming_body()
    {
        byte[] payload = Encoding.UTF8.GetBytes(new string('x', 100));
        TrackingStream body = new(payload);
        DefaultHttpContext http = new();
        http.Request.Body = body;
        http.Request.ContentLength = 100;

        InboundWebhookBoundedBodyReadResult result =
            await InboundWebhookBoundedBodyReader.ReadUtf8Async(http.Request, maxUtf8Bytes: 64, CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ObservedOrDeclaredBytes.Should().Be(100);
        body.BytesRead.Should().Be(0);
    }

    [Fact]
    public async Task ReadUtf8Async_rejects_stream_over_max_when_ContentLength_missing()
    {
        byte[] payload = Encoding.UTF8.GetBytes(new string('y', 80));
        DefaultHttpContext http = new();
        http.Request.Body = new MemoryStream(payload);
        http.Request.ContentLength = null;

        InboundWebhookBoundedBodyReadResult result =
            await InboundWebhookBoundedBodyReader.ReadUtf8Async(http.Request, maxUtf8Bytes: 64, CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ObservedOrDeclaredBytes.Should().BeGreaterThan(64);
        result.Body.Should().BeNull();
    }

    [Fact]
    public async Task ReadUtf8Async_returns_body_when_under_max()
    {
        const string text = "{\"ok\":true}";
        byte[] payload = Encoding.UTF8.GetBytes(text);
        DefaultHttpContext http = new();
        http.Request.Body = new MemoryStream(payload);
        http.Request.ContentLength = payload.Length;

        InboundWebhookBoundedBodyReadResult result =
            await InboundWebhookBoundedBodyReader.ReadUtf8Async(http.Request, maxUtf8Bytes: 64, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Body.Should().Be(text);
        result.ObservedOrDeclaredBytes.Should().Be(payload.Length);
    }

    private sealed class TrackingStream : MemoryStream
    {
        public TrackingStream(byte[] buffer)
            : base(buffer)
        {
        }

        public long BytesRead
        {
            get;
            private set;
        }

        public override async ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default)
        {
            int read = await base.ReadAsync(buffer, cancellationToken);

            BytesRead += read;

            return read;
        }
    }
}
