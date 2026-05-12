using System.Net;

using ArchLucid.TestSupport.Http;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureRequestConcurrencyTestSupportTests
{
    [Fact]
    public async Task PostSingleArchitectureRequestAsync_when_response_buffering_aborts_after_cancellation_throws_operation_canceled_exception()
    {
        using CancellationTokenSource cancellationTokenSource = new();
        using RecordingHttpMessageHandler handler = new(_ => CreateResponse(cancellationTokenSource, cancelBeforeThrow: true));
        using HttpClient client = CreateClient(handler);

        async Task Act() => await ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestAsync(client, TestRequestFactory.CreateArchitectureRequest("REQ-BUFFER-CANCEL-001"), "idem-buffer-cancel-001", cancellationTokenSource.Token);

        OperationCanceledException exception = await Assert.ThrowsAsync<OperationCanceledException>(Act);
        exception.CancellationToken.Should().Be(cancellationTokenSource.Token);
        exception.InnerException.Should().BeOfType<HttpRequestException>();
    }

    [Fact]
    public async Task PostSingleArchitectureRequestAsync_when_response_buffering_aborts_without_cancellation_preserves_transport_exception()
    {
        using RecordingHttpMessageHandler handler = new(_ => CreateResponse(cancellationTokenSource: null, cancelBeforeThrow: false));
        using HttpClient client = CreateClient(handler);

        Func<Task> act = async () => await ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestAsync(
            client,
            TestRequestFactory.CreateArchitectureRequest("REQ-BUFFER-FAIL-001"),
            "idem-buffer-fail-001",
            CancellationToken.None);

        await Assert.ThrowsAsync<HttpRequestException>(act);
    }

    private static HttpClient CreateClient(HttpMessageHandler handler) =>
        new(handler)
        {
            BaseAddress = new Uri("http://localhost")
        };

    private static HttpResponseMessage CreateResponse(
        CancellationTokenSource? cancellationTokenSource,
        bool cancelBeforeThrow)
    {
        CancellationTokenSource? sourceToCancel = cancelBeforeThrow ? cancellationTokenSource : null;

        return new HttpResponseMessage(HttpStatusCode.Created)
        {
            Content = new FaultingBufferHttpContent(CreateClientAbortedRequestException(), sourceToCancel)
        };
    }

    private static HttpRequestException CreateClientAbortedRequestException() =>
        new(
            "Buffering failed.",
            new IOException("The client aborted the request."));
}
