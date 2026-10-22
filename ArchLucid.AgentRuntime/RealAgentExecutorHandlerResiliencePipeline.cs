using System.Collections.Concurrent;

using ArchLucid.Contracts.Agents;

using Polly;
using Polly.CircuitBreaker;
using Polly.Timeout;

namespace ArchLucid.AgentRuntime;

/// <summary>Per-dispatch-key Polly pipelines (timeout + circuit breaker) for <see cref="RealAgentExecutor" />.</summary>
internal static class RealAgentExecutorHandlerResiliencePipeline
{
    private static readonly ConcurrentDictionary<string, ResiliencePipeline<AgentResult>> Pipelines = new(StringComparer.OrdinalIgnoreCase);

    internal static ResiliencePipeline<AgentResult> Resolve(
        string dispatchKey,
        int timeoutSeconds,
        AgentExecutionResilienceOptions options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dispatchKey);
        ArgumentNullException.ThrowIfNull(options);

        options.Normalize();

        string cacheKey = BuildCacheKey(dispatchKey, timeoutSeconds, options);

        return Pipelines.GetOrAdd(cacheKey, _ => BuildPipeline(timeoutSeconds, options));
    }

    internal static bool IsDegradableFailure(Exception exception)
    {
        for (Exception? walker = exception; walker is not null; walker = walker.InnerException)
        {
            if (walker is TimeoutRejectedException or BrokenCircuitException)
                return true;
        }

        return false;
    }

    internal static bool ShouldUseDegradedFallback(AgentTask task, AgentExecutionResilienceOptions options)
    {
        ArgumentNullException.ThrowIfNull(task);
        ArgumentNullException.ThrowIfNull(options);

        if (!options.NonCriticDegradedFallbackEnabled)
            return false;

        return task.AgentType != ArchLucid.Contracts.Common.AgentType.Critic;
    }

    private static string BuildCacheKey(string dispatchKey, int timeoutSeconds, AgentExecutionResilienceOptions options)
    {
        return string.Join(
            ':',
            dispatchKey,
            timeoutSeconds,
            options.HandlerCircuitBreakerFailureThreshold,
            options.HandlerCircuitBreakerBreakSeconds,
            options.NonCriticDegradedFallbackEnabled);
    }

    private static ResiliencePipeline<AgentResult> BuildPipeline(int timeoutSeconds, AgentExecutionResilienceOptions options)
    {
        ResiliencePipelineBuilder<AgentResult> builder = new();

        if (options.HandlerCircuitBreakerFailureThreshold > 0 && options.HandlerCircuitBreakerBreakSeconds > 0)
        {
            builder.AddCircuitBreaker(
                new CircuitBreakerStrategyOptions<AgentResult>
                {
                    FailureRatio = 1.0,
                    MinimumThroughput = options.HandlerCircuitBreakerFailureThreshold,
                    BreakDuration = TimeSpan.FromSeconds(options.HandlerCircuitBreakerBreakSeconds),
                    SamplingDuration = TimeSpan.FromMinutes(2),
                    ShouldHandle = new PredicateBuilder<AgentResult>().Handle<Exception>(),
                });
        }

        if (timeoutSeconds > 0)
            builder.AddTimeout(TimeSpan.FromSeconds(timeoutSeconds));

        return builder.Build();
    }
}
