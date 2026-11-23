using System.Net;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Resilience;
using ArchLucid.Retrieval.Embedding;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Polly;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
/// Tests for Circuit Breaking Open Ai Embedding Client.
/// </summary>

[Trait("Category", "Unit")]
public sealed class CircuitBreakingOpenAiEmbeddingClientTests
{
    [Fact]
    public async Task Success_resets_gate_via_RecordSuccess()
    {
        Mock<IOpenAiEmbeddingClient> inner = new();
        float[] vector = [0.1f, 0.2f];
        inner.Setup(c => c.EmbedAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync(vector);

        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 60
        };
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        CircuitBreakingOpenAiEmbeddingClient sut = new(
            inner.Object,
            gate,
            ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingOpenAiEmbeddingClient>.Instance);

        float[] result = await sut.EmbedAsync("x", CancellationToken.None);

        result.Should().Equal(vector);
        inner.Verify(c => c.EmbedAsync("x", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Inner_failure_records_gate_failure()
    {
        Mock<IOpenAiEmbeddingClient> inner = new();
        inner.Setup(c => c.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("provider unavailable"));

        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 60
        };
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        CircuitBreakingOpenAiEmbeddingClient sut = new(
            inner.Object,
            gate,
            ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingOpenAiEmbeddingClient>.Instance);

        Func<Task> act = () => sut.EmbedAsync("x", CancellationToken.None);

        await act.Should().ThrowAsync<HttpRequestException>();

        clock.Advance(TimeSpan.FromSeconds(1));
        Func<Task> act2 = () => sut.EmbedAsync("y", CancellationToken.None);

        await act2.Should().ThrowAsync<CircuitBreakerOpenException>();
    }

    [Fact]
    public async Task EmbedAsync_Retry_TransientThenSuccess()
    {
        int calls = 0;
        Mock<IOpenAiEmbeddingClient> inner = new();
        float[] vector = [0.3f];
        inner.Setup(c => c.EmbedAsync("x", It.IsAny<CancellationToken>()))
            .Returns(
                (string _, CancellationToken _) =>
                {
                    int n = Interlocked.Increment(ref calls);

                    return n < 3 ? Task.FromException<float[]>(new HttpRequestException("429")) : Task.FromResult(vector);
                });

        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 5,
            DurationOfBreakSeconds = 60
        };

        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("embed-retry", options, clock.ToFunc());
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 4,
            baseDelay: TimeSpan.FromMilliseconds(1));

        CircuitBreakingOpenAiEmbeddingClient sut = new(
            inner.Object,
            gate,
            retry,
            NullLogger<CircuitBreakingOpenAiEmbeddingClient>.Instance);

        float[] result = await sut.EmbedAsync("x", CancellationToken.None);

        result.Should().Equal(vector);
        calls.Should().Be(3);
    }

    [Fact]
    public async Task EmbedManyAsync_Retry_TransientThenSuccess()
    {
        int calls = 0;
        Mock<IOpenAiEmbeddingClient> inner = new();
        IReadOnlyList<float[]> batch = [[0.1f]];
        inner.Setup(c => c.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Returns(
                (IReadOnlyList<string> _, CancellationToken _) =>
                {
                    int n = Interlocked.Increment(ref calls);

                    return n < 2 ? Task.FromException<IReadOnlyList<float[]>>(new HttpRequestException("503")) : Task.FromResult(batch);
                });

        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 5,
            DurationOfBreakSeconds = 60
        };
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("embed-batch-retry", options, clock.ToFunc());
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3,
            baseDelay: TimeSpan.FromMilliseconds(1));

        CircuitBreakingOpenAiEmbeddingClient sut = new(
            inner.Object,
            gate,
            retry,
            NullLogger<CircuitBreakingOpenAiEmbeddingClient>.Instance);

        IReadOnlyList<float[]> result = await sut.EmbedManyAsync(["a"], CancellationToken.None);

        result.Should().Equal(batch);
        calls.Should().Be(2);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Semantic_terminal_failure_does_not_trip_embedding_gate(bool batch)
    {
        Mock<IOpenAiEmbeddingClient> inner = new();
        inner.Setup(c => c.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("invalid embedding payload"));
        inner.Setup(c => c.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("invalid embedding payload"));
        CircuitBreakerGate gate = new("embedding-semantic",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 60 });
        CircuitBreakingOpenAiEmbeddingClient sut = new(
            inner.Object, gate, ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingOpenAiEmbeddingClient>.Instance);

        Func<Task> run = batch
            ? async () => await sut.EmbedManyAsync(["x"], CancellationToken.None)
            : async () => await sut.EmbedAsync("x", CancellationToken.None);

        await run.Should().ThrowAsync<InvalidOperationException>();
        await run.Should().ThrowAsync<InvalidOperationException>();
        gate.CurrentState.Should().Be("Closed");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Half_open_embedding_probe_skips_retry_pipeline(bool batch)
    {
        int calls = 0;
        Mock<IOpenAiEmbeddingClient> inner = new();
        Exception Failure() => new HttpRequestException("provider down", null, HttpStatusCode.ServiceUnavailable);
        inner.Setup(c => c.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken _) =>
            {
                Interlocked.Increment(ref calls);
                return Task.FromException<float[]>(Failure());
            });
        inner.Setup(c => c.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Returns((IReadOnlyList<string> _, CancellationToken _) =>
            {
                Interlocked.Increment(ref calls);
                return Task.FromException<IReadOnlyList<float[]>>(Failure());
            });

        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("embedding-single-probe",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 30 },
            clock.ToFunc());
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            maxRetryAttempts: 3, baseDelay: TimeSpan.FromMilliseconds(1));
        CircuitBreakingOpenAiEmbeddingClient sut = new(
            inner.Object, gate, retry,
            NullLogger<CircuitBreakingOpenAiEmbeddingClient>.Instance);

        gate.RecordFailure();
        clock.Advance(TimeSpan.FromSeconds(31));

        Func<Task> invoke = batch
            ? async () => { await sut.EmbedManyAsync(["x"], CancellationToken.None); }
            : async () => { await sut.EmbedAsync("x", CancellationToken.None); };

        await Assert.ThrowsAsync<HttpRequestException>(invoke);

        calls.Should().Be(1);
        gate.CurrentState.Should().Be("Open");
        await Assert.ThrowsAsync<CircuitBreakerOpenException>(invoke);
        calls.Should().Be(1);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public async Task Half_open_neutral_failure_releases_probe_for_next_embedding(bool batch, bool cancellation)
    {
        int calls = 0;
        Exception NextFailure() => Interlocked.Increment(ref calls) == 1
            ? new HttpRequestException("provider unavailable", null, HttpStatusCode.ServiceUnavailable)
            : cancellation
                ? new OperationCanceledException("operation cancelled")
                : new HttpRequestException("bad embedding request", null, HttpStatusCode.BadRequest);

        Mock<IOpenAiEmbeddingClient> inner = new();
        inner.Setup(c => c.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken _) => Task.FromException<float[]>(NextFailure()));
        inner.Setup(c => c.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Returns((IReadOnlyList<string> _, CancellationToken _) =>
                Task.FromException<IReadOnlyList<float[]>>(NextFailure()));

        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("embedding-neutral-probe",
            new CircuitBreakerOptions { FailureThreshold = 1, DurationOfBreakSeconds = 30 },
            clock.ToFunc());
        CircuitBreakingOpenAiEmbeddingClient sut = new(
            inner.Object, gate, ResiliencePipeline.Empty,
            NullLogger<CircuitBreakingOpenAiEmbeddingClient>.Instance);

        Func<Task> invoke = batch
            ? async () => { await sut.EmbedManyAsync(["x"], CancellationToken.None); }
            : async () => { await sut.EmbedAsync("x", CancellationToken.None); };

        await Assert.ThrowsAsync<HttpRequestException>(invoke);
        gate.CurrentState.Should().Be("Open");

        clock.Advance(TimeSpan.FromSeconds(31));
        if (cancellation)
            await Assert.ThrowsAsync<OperationCanceledException>(invoke);
        else
            await Assert.ThrowsAsync<HttpRequestException>(invoke);
        gate.CurrentState.Should().Be("Open");

        // A second probe must be admitted immediately, not rejected as "probe in progress".
        if (cancellation)
            await Assert.ThrowsAsync<OperationCanceledException>(invoke);
        else
            await Assert.ThrowsAsync<HttpRequestException>(invoke);
        calls.Should().Be(3);
        gate.ConsecutiveFailureCount.Should().Be(1);
    }

    private sealed class MutableUtcClock
    {
        private DateTimeOffset _now;

        public MutableUtcClock(DateTimeOffset start) => _now = start;

        public void Advance(TimeSpan delta) => _now = _now.Add(delta);

        public Func<DateTimeOffset> ToFunc() => () => _now;
    }
}
