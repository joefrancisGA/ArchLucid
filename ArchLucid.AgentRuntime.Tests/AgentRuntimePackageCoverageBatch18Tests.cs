using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

using Polly.CircuitBreaker;
using Polly.Timeout;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch18Tests
{
    [Fact]
    public void RealAgentExecutorHandlerResiliencePipeline_Resolve_caches_pipelines_per_dispatch_key()
    {
        AgentExecutionResilienceOptions options = new()
        {
            HandlerCircuitBreakerFailureThreshold = 2,
            HandlerCircuitBreakerBreakSeconds = 30,
            NonCriticDegradedFallbackEnabled = true,
        };

        var first = RealAgentExecutorHandlerResiliencePipeline.Resolve("topology", 30, options);
        var second = RealAgentExecutorHandlerResiliencePipeline.Resolve("topology", 30, options);
        var differentKey = RealAgentExecutorHandlerResiliencePipeline.Resolve("cost", 30, options);

        first.Should().BeSameAs(second);
        differentKey.Should().NotBeSameAs(first);
    }

    [Theory]
    [InlineData(typeof(TimeoutRejectedException), true)]
    [InlineData(typeof(BrokenCircuitException), true)]
    [InlineData(typeof(InvalidOperationException), false)]
    public void RealAgentExecutorHandlerResiliencePipeline_IsDegradableFailure_walks_inner_exceptions(Type exceptionType, bool expected)
    {
        Exception inner = (Exception)Activator.CreateInstance(exceptionType, "simulated")!;
        Exception wrapped = new InvalidOperationException("outer", inner);

        if (exceptionType == typeof(InvalidOperationException))
            wrapped = inner;

        RealAgentExecutorHandlerResiliencePipeline.IsDegradableFailure(wrapped).Should().Be(expected);
    }

    [Theory]
    [InlineData(AgentType.Critic, true, false)]
    [InlineData(AgentType.Topology, true, true)]
    [InlineData(AgentType.Topology, false, false)]
    public void RealAgentExecutorHandlerResiliencePipeline_ShouldUseDegradedFallback_respects_critic_and_option(
        AgentType agentType,
        bool fallbackEnabled,
        bool expected)
    {
        AgentTask task = new() { AgentType = agentType };
        AgentExecutionResilienceOptions options = new() { NonCriticDegradedFallbackEnabled = fallbackEnabled };

        RealAgentExecutorHandlerResiliencePipeline.ShouldUseDegradedFallback(task, options).Should().Be(expected);
    }

    [Theory]
    [InlineData("topology", 120, 120)]
    [InlineData("topology", 0, 900)]
    [InlineData("missing", 60, 900)]
    public void AgentExecutionResilienceOptions_ResolveTimeoutSecondsForAgent_honors_per_agent_overrides(
        string dispatchKey,
        int configuredOverride,
        int expectedSeconds)
    {
        AgentExecutionResilienceOptions options = new()
        {
            PerHandlerTimeoutSeconds = 900,
            PerAgentTimeoutSeconds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["topology"] = configuredOverride,
            },
        };

        options.ResolveTimeoutSecondsForAgent(dispatchKey).Should().Be(expectedSeconds);
    }

    [Fact]
    public void AgentExecutionResilienceOptions_ResolveTimeoutSecondsForAgent_returns_zero_when_global_timeout_disabled()
    {
        AgentExecutionResilienceOptions options = new() { PerHandlerTimeoutSeconds = 0 };

        options.ResolveTimeoutSecondsForAgent("topology").Should().Be(0);
    }

    [Fact]
    public void AgentExecutionResilienceOptions_Normalize_clamps_retry_and_breaker_settings()
    {
        AgentExecutionResilienceOptions options = new()
        {
            LlmCallMaxRetryAttempts = 99,
            LlmCallBaseDelayMilliseconds = 1,
            LlmCallMaxDelaySeconds = 999,
            HandlerCircuitBreakerFailureThreshold = 99,
            HandlerCircuitBreakerBreakSeconds = 9999,
        };

        options.Normalize();

        options.LlmCallMaxRetryAttempts.Should().Be(10);
        options.LlmCallBaseDelayMilliseconds.Should().Be(50);
        options.LlmCallMaxDelaySeconds.Should().Be(120);
        options.HandlerCircuitBreakerFailureThreshold.Should().Be(20);
        options.HandlerCircuitBreakerBreakSeconds.Should().Be(3600);
    }
}
