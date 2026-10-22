using ArchLucid.Core.Resilience;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

using Polly;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Validates high-visibility circuit breaker state-transition logs (<c>Improvement 18</c>, <c>LATEST.md</c>).
/// </summary>
[Trait("Category", "Unit")]
public sealed class CircuitBreakingAgentCompletionClientLoggingTests
{
    [SkippableFact]
    public async Task When_circuit_trips_writes_distinct_Open_warning_before_failure_warning()
    {
        CollectingLogger logger = new();
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("429"));

        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        TestClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("open-log-gate", options, clock.ToFunc());

        CircuitBreakingAgentCompletionClient sut = new(inner.Object, gate, ResiliencePipeline.Empty, logger);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        logger.Entries.Count(e =>
                e.Level == LogLevel.Warning &&
                e.Message.Contains("LLM Circuit Breaker opened due to consecutive failures", StringComparison.Ordinal))
            .Should().Be(1);
        logger.Entries.Count(e =>
                e.Level == LogLevel.Warning &&
                e.Message.Contains("LLM completion call failed after retries", StringComparison.Ordinal))
            .Should().Be(1);
    }

    [SkippableFact]
    public async Task Inner_failure_below_threshold_logs_only_call_failure_Not_Open_message()
    {
        CollectingLogger logger = new();
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("429"));

        CircuitBreakerOptions options = new() { FailureThreshold = 5, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("below-threshold-gate", options);

        CircuitBreakingAgentCompletionClient sut = new(inner.Object, gate, ResiliencePipeline.Empty, logger);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        logger.Entries.Should().NotContain(e =>
            e.Message.Contains("LLM Circuit Breaker opened due to consecutive failures", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task Half_open_recovery_success_writes_Information_reset_log()
    {
        CollectingLogger logger = new();
        int attempts = 0;
        Mock<IAgentCompletionClient> inner = new();
        inner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("mock", "mock"));
        inner.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                int n = Interlocked.Increment(ref attempts);

                return n == 1
                    ? Task.FromException<string>(new HttpRequestException("fail"))
                    : Task.FromResult("{}");
            });

        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        TestClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("probe-reset-gate", options, clock.ToFunc());

        CircuitBreakingAgentCompletionClient sut = new(inner.Object, gate, ResiliencePipeline.Empty, logger);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None));

        clock.Advance(TimeSpan.FromSeconds(61));

        string ok = await sut.CompleteJsonAsync("s", "u", cancellationToken: CancellationToken.None);

        ok.Should().Be("{}");
        logger.Entries.Should().ContainSingle(e =>
            e.Level == LogLevel.Information &&
            e.Message.Contains("LLM Circuit Breaker reset", StringComparison.Ordinal));
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

    private sealed class CollectingLogger : ILogger<CircuitBreakingAgentCompletionClient>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = new();

        public IDisposable BeginScope<TState>(TState state)
            where TState : notnull => NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Entries.Add((logLevel, formatter(state, exception)));
        }

        private sealed class NullScope : IDisposable
        {
            public static NullScope Instance { get; } = new();

            public void Dispose()
            {
            }
        }
    }
}
