using System.Net;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Resilience;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Polly;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Circuit Breaking Agent Completion Client.
/// </summary>
[Trait("Category", "Unit")]
public sealed class CircuitBreakingAgentCompletionClientTests
{
    [SkippableFact]
    public async Task Success_delegates_to_inner()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{}");

        CircuitBreakerOptions options = new() { FailureThreshold = 5, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("test-gate", options);

        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object,
            gate,
            ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        result.Should().Be("{}");
    }

    [SkippableFact]
    public async Task Inner_failure_opens_circuit_after_threshold()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("429"));

        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        TestClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object,
            gate,
            ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        clock.Advance(TimeSpan.FromSeconds(1));

        await Assert.ThrowsAsync<CircuitBreakerOpenException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));
    }

    [SkippableFact]
    public async Task Retry_TransientFailure_SucceedsBeforeCBTrip()
    {
        int callCount = 0;
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                int n = Interlocked.Increment(ref callCount);

                return n < 3
                    ? Task.FromException<string>(new HttpRequestException("transient"))
                    : Task.FromResult("{}");
            });

        CircuitBreakerOptions options = new() { FailureThreshold = 5, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("retry-ok-gate", options);
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 4,
            baseDelay: TimeSpan.FromMilliseconds(1),
            maxDelay: TimeSpan.FromMilliseconds(50));

        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object,
            gate,
            retry,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        result.Should().Be("{}");
        callCount.Should().Be(3);
    }

    [SkippableFact]
    public async Task Retry_ExhaustedThenCBTrips()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("always fail"));

        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        TestClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("retry-exhaust-gate", options, clock.ToFunc());
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3,
            baseDelay: TimeSpan.FromMilliseconds(1));

        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object,
            gate,
            retry,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        clock.Advance(TimeSpan.FromSeconds(1));

        await Assert.ThrowsAsync<CircuitBreakerOpenException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        inner.Verify(
            c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Exactly(4));
    }

    [SkippableFact]
    public async Task Retry_UserCancellation_DoesNotTripCircuit_UserBearerCancelled()
    {
        int calls = 0;
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string _, int? _, float? _, CancellationToken ct) =>
            {
                Interlocked.Increment(ref calls);

                return ct.IsCancellationRequested
                    ? Task.FromException<string>(new OperationCanceledException(ct))
                    : Task.FromResult("{}");
            });

        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("cancel-gate", options);
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3,
            baseDelay: TimeSpan.FromMilliseconds(1));

        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object,
            gate,
            retry,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: cts.Token));

        string ok = await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        ok.Should().Be("{}");
    }

    [SkippableFact]
    public async Task Semantic_terminal_failure_does_not_trip_circuit()
    {
        int calls = 0;
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                int n = Interlocked.Increment(ref calls);

                return n == 1
                    ? Task.FromException<string>(new InvalidOperationException("Azure OpenAI returned an empty assistant message."))
                    : Task.FromResult("{}");
            });

        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("semantic-gate", options);

        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object,
            gate,
            ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        string ok = await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        ok.Should().Be("{}");
        calls.Should().Be(2);
    }

    [Fact]
    public async Task Half_open_completion_probe_skips_retries_even_when_retry_pipeline_is_configured()
    {
        int calls = 0;
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref calls);
                return Task.FromException<string>(new HttpRequestException("provider still down",
                    null, HttpStatusCode.ServiceUnavailable));
            });

        TestClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("completion-single-probe",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 30 },
            clock.ToFunc());
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3, baseDelay: TimeSpan.FromMilliseconds(1));
        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object, gate, retry,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        gate.RecordFailure();
        clock.Advance(TimeSpan.FromSeconds(31));

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        // A recovery probe is one provider call, not one Polly execution with four attempts.
        calls.Should().Be(1);
        gate.CurrentState.Should().Be("Open");
        await Assert.ThrowsAsync<CircuitBreakerOpenException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));
        calls.Should().Be(1);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Half_open_neutral_completion_failure_releases_probe(bool cancellation)
    {
        int calls = 0;
        Exception NextFailure() => Interlocked.Increment(ref calls) == 1
            ? new HttpRequestException("provider unavailable", null, HttpStatusCode.ServiceUnavailable)
            : cancellation
                ? new OperationCanceledException("operation cancelled")
                : new HttpRequestException("invalid completion request", null, HttpStatusCode.BadRequest);

        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() => Task.FromException<string>(NextFailure()));

        TestClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("completion-neutral-probe",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 30 },
            clock.ToFunc());
        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object, gate, ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        Func<Task> invoke = () => sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        await Assert.ThrowsAsync<HttpRequestException>(invoke);
        gate.CurrentState.Should().Be("Open");

        clock.Advance(TimeSpan.FromSeconds(31));
        if (cancellation)
            await Assert.ThrowsAsync<OperationCanceledException>(invoke);
        else
            await Assert.ThrowsAsync<HttpRequestException>(invoke);
        gate.CurrentState.Should().Be("Open");

        // Semantic-terminal and intentional cancellation errors must not hold the probe slot.
        if (cancellation)
            await Assert.ThrowsAsync<OperationCanceledException>(invoke);
        else
            await Assert.ThrowsAsync<HttpRequestException>(invoke);
        calls.Should().Be(3);
        gate.ConsecutiveFailureCount.Should().Be(1);
    }

    [Fact]
    public async Task Half_open_unenumerated_stream_does_not_reserve_recovery_probe()
    {
        Mock<IAgentStreamingCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.StreamJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string _, int? _, float? _, CancellationToken _) => TwoChunks());

        TestClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("stream-lazy-probe",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 30 },
            clock.ToFunc());
        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object, gate, ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        gate.RecordFailure();
        gate.CurrentState.Should().Be("Open");
        clock.Advance(TimeSpan.FromSeconds(31));

        // Merely constructing an IAsyncEnumerable must not consume the half-open probe slot.
        IAsyncEnumerable<string> abandoned = sut.StreamJsonAsync("s", "u");
        abandoned.Should().NotBeNull();
        gate.CurrentState.Should().Be("Open");

        int chunks = 0;
        await foreach (string _ in sut.StreamJsonAsync("s", "u"))
            chunks++;

        chunks.Should().Be(2);
        gate.CurrentState.Should().Be("Closed");
        inner.Verify(c => c.StreamJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Early_stream_disposal_does_not_open_circuit()
    {
        Mock<IAgentStreamingCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.StreamJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string _, int? _, float? _, CancellationToken _) => TwoChunks());

        CircuitBreakerGate gate = new("stream-early-dispose",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 60 });
        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object, gate, ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        for (int i = 0; i < 2; i++)
        {
            await foreach (string chunk in sut.StreamJsonAsync("s", "u"))
            {
                chunk.Should().Be("first");
                break;
            }
        }

        gate.CurrentState.Should().Be("Closed");
    }

    [Fact]
    public async Task Streaming_transport_failure_opens_circuit()
    {
        Mock<IAgentStreamingCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.StreamJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string _, int? _, float? _, CancellationToken _) => FailingStream());

        CircuitBreakerGate gate = new("stream-transport",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 60 });
        CircuitBreakingAgentCompletionClient sut = new(
            inner.Object, gate, ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);

        Func<Task> run = async () =>
        {
            await foreach (string _ in sut.StreamJsonAsync("s", "u")) { }
        };
        await run.Should().ThrowAsync<HttpRequestException>();
        gate.CurrentState.Should().Be("Open");
    }

    private static async IAsyncEnumerable<string> TwoChunks()
    {
        yield return "first";
        await Task.Yield();
        yield return "second";
    }

    private static async IAsyncEnumerable<string> FailingStream()
    {
        yield return "first";
        await Task.Yield();
        throw new HttpRequestException("upstream failed");
    }

    private sealed class TestClock(DateTimeOffset start)
    {
        private DateTimeOffset _t = start;

        public void Advance(TimeSpan delta)
        {
            _t += delta;
        }

        public Func<DateTimeOffset> ToFunc()
        {
            return () => _t;
        }
    }
}
