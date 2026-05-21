using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics;
using System.Net;

using FluentAssertions;

using Moq;

using Polly;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmCallResilienceDefaultsTests
{
    [SkippableFact]
    public async Task BuildLlmRetryPipeline_ZeroAttempts_RunsDelegateOnce()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(maxRetryAttempts: 0);

        int calls = 0;
        await pipeline.ExecuteAsync(
            async _ =>
            {
                Interlocked.Increment(ref calls);
                await Task.Delay(1, CancellationToken.None);
            },
            CancellationToken.None);

        calls.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildLlmRetryPipeline_HonorsRetryAfterHeaderOnClientResult503()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 1,
            baseDelay: TimeSpan.FromMinutes(5),
            maxDelay: TimeSpan.FromMinutes(10));

        int calls = 0;
        Stopwatch stopwatch = Stopwatch.StartNew();

        await pipeline.ExecuteAsync(
            _ =>
            {
                if (Interlocked.Increment(ref calls) == 1)
                    throw CreateClientResultExceptionWithRetryAfter(HttpStatusCode.ServiceUnavailable, "0");

                return ValueTask.CompletedTask;
            },
            CancellationToken.None);

        stopwatch.Stop();
        calls.Should().Be(2);
        stopwatch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(3));
    }

    [SkippableFact]
    public async Task BuildLlmRetryPipeline_HonorsRetryAfterHeaderOnHttpRequestException()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 1,
            baseDelay: TimeSpan.FromMinutes(5),
            maxDelay: TimeSpan.FromMinutes(10));

        int calls = 0;
        Stopwatch stopwatch = Stopwatch.StartNew();

        await pipeline.ExecuteAsync(
            _ =>
            {
                if (Interlocked.Increment(ref calls) == 1)
                {
                    ClientResultException inner = CreateClientResultExceptionWithRetryAfter(
                        HttpStatusCode.ServiceUnavailable,
                        "0");

                    throw new HttpRequestException("boom", inner, HttpStatusCode.ServiceUnavailable);
                }

                return ValueTask.CompletedTask;
            },
            CancellationToken.None);

        stopwatch.Stop();
        calls.Should().Be(2);
        stopwatch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(3));
    }

    [SkippableFact]
    public async Task BuildLlmRetryPipeline_RetriesHttpRequestException()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 4,
            baseDelay: TimeSpan.FromMilliseconds(1));

        int calls = 0;

        await pipeline.ExecuteAsync(
            _ =>
            {
                int n = Interlocked.Increment(ref calls);

                if (n < 3)
                {
                    throw new HttpRequestException(
                        "boom",
                        null,
                        HttpStatusCode.ServiceUnavailable);
                }

                return ValueTask.CompletedTask;
            },
            CancellationToken.None);

        calls.Should().Be(3);
    }

    [SkippableFact]
    public async Task BuildLlmRetryPipeline_DoesNotRetryClientResultException429()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 2,
            baseDelay: TimeSpan.FromMilliseconds(1));

        int calls = 0;

        Func<Task> act = () => pipeline.ExecuteAsync(
                _ =>
                {
                    Interlocked.Increment(ref calls);
                    throw CreateClientResultException(429);
                },
                CancellationToken.None)
            .AsTask();

        await act.Should().ThrowAsync<ClientResultException>();
        calls.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildLlmRetryPipeline_DoesNotRetryClientResultException400()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3,
            baseDelay: TimeSpan.FromMilliseconds(1));

        int calls = 0;

        Func<Task> act = () => pipeline.ExecuteAsync(
                _ =>
                {
                    Interlocked.Increment(ref calls);
                    throw CreateClientResultException(400);
                },
                CancellationToken.None)
            .AsTask();

        await act.Should().ThrowAsync<ClientResultException>();
        calls.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildLlmRetryPipeline_DoesNotRetryInvalidOperationException()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3,
            baseDelay: TimeSpan.FromMilliseconds(1));

        int calls = 0;

        Func<Task> act = () => pipeline.ExecuteAsync(
                _ =>
                {
                    Interlocked.Increment(ref calls);
                    throw new InvalidOperationException("empty assistant message");
                },
                CancellationToken.None)
            .AsTask();

        await act.Should().ThrowAsync<InvalidOperationException>();
        calls.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildLlmRetryPipeline_PropagatesUserCancellation()
    {
        ResiliencePipeline pipeline = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3,
            baseDelay: TimeSpan.FromMilliseconds(1));

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        int calls = 0;

        Func<Task> act = () => pipeline.ExecuteAsync(
                async ct =>
                {
                    Interlocked.Increment(ref calls);
                    await Task.Delay(Timeout.Infinite, ct);
                },
                cts.Token)
            .AsTask();

        await act.Should().ThrowAsync<OperationCanceledException>();

        // Polly may short-circuit before the callback, or invoke it with a linked/canceled token once.
        calls.Should().BeLessThanOrEqualTo(1);
    }

    [Theory]
    [InlineData(429, false)]
    [InlineData(500, true)]
    [InlineData(502, true)]
    [InlineData(503, true)]
    [InlineData(504, true)]
    [InlineData(400, false)]
    [InlineData(401, false)]
    [InlineData(403, false)]
    [InlineData(404, false)]
    public void ShouldRetryLlmException_ClientResult_status_codes(int status, bool expected)
    {
        Exception ex = CreateClientResultException(status);

        LlmCallResilienceDefaults.ShouldRetryLlmException(ex).Should().Be(expected);
    }

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests, true)]
    [InlineData(HttpStatusCode.InternalServerError, true)]
    [InlineData(HttpStatusCode.BadGateway, true)]
    [InlineData(HttpStatusCode.ServiceUnavailable, true)]
    [InlineData(HttpStatusCode.GatewayTimeout, true)]
    [InlineData(HttpStatusCode.BadRequest, false)]
    [InlineData(HttpStatusCode.Unauthorized, false)]
    [InlineData(HttpStatusCode.Forbidden, false)]
    [InlineData(HttpStatusCode.NotFound, false)]
    public void ShouldRetryLlmException_HttpRequestException_status(HttpStatusCode code, bool expected)
    {
        Exception ex = new HttpRequestException("x", null, code);

        LlmCallResilienceDefaults.ShouldRetryLlmException(ex).Should().Be(expected);
    }

    private static ClientResultException CreateClientResultException(int status)
    {
        Mock<PipelineResponse> response = new();
        response.SetupGet(r => r.Status).Returns(status);

        return new ClientResultException("test", response.Object);
    }

    private static ClientResultException CreateClientResultExceptionWithRetryAfter(
        HttpStatusCode status,
        string retryAfter)
    {
        Mock<PipelineResponseHeaders> headers = new();
        headers
            .Setup(h => h.TryGetValue("Retry-After", out It.Ref<string?>.IsAny))
            .Returns((string _, out string? value) =>
            {
                value = retryAfter;
                return true;
            });

        UnitPipelineResponse response = new((int)status, headers.Object);

        return new ClientResultException("test", response);
    }

    /// <summary>Minimal <see cref="PipelineResponse" /> for exercising Retry-After header parsing without the live SDK.</summary>
    private sealed class UnitPipelineResponse(int status, PipelineResponseHeaders headers) : PipelineResponse
    {
        public override int Status
        {
            get;
        } = status;

        public override string ReasonPhrase => "unit";

        public override BinaryData Content => BinaryData.Empty;

        public override Stream? ContentStream
        {
            get;
            set;
        } = Stream.Null;

        protected override PipelineResponseHeaders HeadersCore
        {
            get;
        } = headers;

        public override BinaryData BufferContent(CancellationToken cancellationToken = default) => BinaryData.Empty;

        public override ValueTask<BinaryData> BufferContentAsync(CancellationToken cancellationToken = default) =>
            ValueTask.FromResult(BinaryData.Empty);

        public override void Dispose()
        {
        }
    }

}
