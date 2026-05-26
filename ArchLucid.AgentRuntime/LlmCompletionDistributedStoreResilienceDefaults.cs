using Microsoft.Extensions.Logging;

using Polly;
using Polly.CircuitBreaker;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Circuit breaker for distributed LLM completion cache calls. When Redis is unhealthy, callers fall back to
///     <see cref="MemoryLlmCompletionResponseStore" /> without blocking completion execution.
/// </summary>
public static class LlmCompletionDistributedStoreResilienceDefaults
{
    /// <summary>Opens the circuit after this many handled failures within the sampling window.</summary>
    public const int CircuitBreakerFailureThreshold = 5;

    /// <summary>Duration the circuit remains open before a trial call is allowed.</summary>
    public const int CircuitBreakerBreakDurationSeconds = 30;

    public static ResiliencePipeline BuildCircuitBreakerPipeline(
        ILogger logger,
        int failureThreshold = CircuitBreakerFailureThreshold,
        int breakDurationSeconds = CircuitBreakerBreakDurationSeconds)
    {
        ArgumentNullException.ThrowIfNull(logger);

        if (failureThreshold < 1)
            throw new ArgumentOutOfRangeException(nameof(failureThreshold));

        if (breakDurationSeconds < 1)
            throw new ArgumentOutOfRangeException(nameof(breakDurationSeconds));

        return new ResiliencePipelineBuilder()
            .AddCircuitBreaker(new CircuitBreakerStrategyOptions
            {
                FailureRatio = 1.0,
                MinimumThroughput = failureThreshold,
                SamplingDuration = TimeSpan.FromMinutes(1),
                BreakDuration = TimeSpan.FromSeconds(breakDurationSeconds),
                ShouldHandle = new PredicateBuilder().Handle<Exception>(),
                OnOpened = args =>
                {
                    logger.LogWarning(
                        args.Outcome.Exception,
                        "LLM completion distributed cache circuit breaker opened after {FailureThreshold} failures; using in-memory fallback for {BreakDurationSeconds}s.",
                        failureThreshold,
                        breakDurationSeconds);

                    return ValueTask.CompletedTask;
                },
            })
            .Build();
    }
}
