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
    public async Task Breaker_rejection_does_not_invoke_handler_or_consume_FND018_handler_budget()
    {
        string key = "rejection-budget-audit-" + Guid.NewGuid().ToString("N");
        AgentExecutionResilienceOptions options = new()
        {
            HandlerCircuitBreakerFailureThreshold = 2,
            HandlerCircuitBreakerBreakSeconds = 60,
        };
        var pipeline = RealAgentExecutorHandlerResiliencePipeline.Resolve(key, 0, options);

        for (int i = 0; i < 2; i++)
        {
            Func<Task> failing = async () => await pipeline.ExecuteAsync(
                _ => ValueTask.FromException<AgentResult>(new InvalidOperationException("handler failed")),
                CancellationToken.None);
            await failing.Should().ThrowAsync<InvalidOperationException>();
            RealAgentExecutorHandlerResiliencePipeline.ObserveOutcome(
                key, AgentType.Topology, AgentHandlerFailureBudgetOutcome.Failure);
        }

        bool handlerEntered = false;
        Func<Task> rejected = async () => await pipeline.ExecuteAsync(
            _ =>
            {
                handlerEntered = true;
                return ValueTask.FromResult(new AgentResult());
            },
            CancellationToken.None);
        await rejected.Should().ThrowAsync<BrokenCircuitException>();
        handlerEntered.Should().BeFalse("Polly must reject before entering the handler delegate");

        AgentHandlerFailureBudgetSnapshot observation =
            RealAgentExecutorHandlerResiliencePipeline.ObserveOutcome(
                key, AgentType.Topology, AgentHandlerFailureBudgetOutcome.NotAdmitted);
        observation.Counted.Should().BeFalse();
        observation.Requests.Should().Be(2);
        observation.Failures.Should().Be(2);
    }

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

    [Fact]
    public async Task RealAgentExecutorHandlerResiliencePipeline_observation_does_not_change_handler_admission()
    {
        string key = "failure-budget-integration-" + Guid.NewGuid().ToString("N");
        AgentExecutionResilienceOptions options = new()
        {
            HandlerCircuitBreakerFailureThreshold = 2,
            HandlerCircuitBreakerBreakSeconds = 60,
        };
        var pipeline = RealAgentExecutorHandlerResiliencePipeline.Resolve(key, 0, options);

        for (int i = 0; i < AgentHandlerFailureBudgetObserver.MaxFailures; i++)
        {
            AgentHandlerFailureBudgetSnapshot observation =
                RealAgentExecutorHandlerResiliencePipeline.ObserveOutcome(
                    key, AgentType.Topology, AgentHandlerFailureBudgetOutcome.Failure);
            if (i == AgentHandlerFailureBudgetObserver.MaxFailures - 1)
                observation.Exhausted.Should().BeTrue();
        }

        // The failure-budget monitor has no authority over Polly's circuit state:
        // these are observations, not five actual execution failures.
        AgentResult expected = new();
        AgentResult actual = await pipeline.ExecuteAsync(
            _ => ValueTask.FromResult(expected), CancellationToken.None);
        actual.Should().BeSameAs(expected);

        AgentHandlerFailureBudgetSnapshot cancelled =
            RealAgentExecutorHandlerResiliencePipeline.ObserveOutcome(
                key, AgentType.Topology, AgentHandlerFailureBudgetOutcome.CallerCancelled);
        cancelled.Counted.Should().BeFalse();
        cancelled.Requests.Should().Be(AgentHandlerFailureBudgetObserver.MaxFailures);
        cancelled.Failures.Should().Be(AgentHandlerFailureBudgetObserver.MaxFailures);
    }

    [Fact]
    public async Task RealAgentExecutorHandlerResiliencePipeline_Cancellation_does_not_open_circuit()
    {
        AgentExecutionResilienceOptions options = new()
        {
            HandlerCircuitBreakerFailureThreshold = 2,
            HandlerCircuitBreakerBreakSeconds = 60,
        };
        var pipeline = RealAgentExecutorHandlerResiliencePipeline.Resolve(
            "cancellation-audit-" + Guid.NewGuid().ToString("N"), 0, options);

        for (int i = 0; i < 3; i++)
        {
            Func<Task> cancelled = async () =>
                await pipeline.ExecuteAsync(
                    _ => ValueTask.FromException<AgentResult>(
                        new OperationCanceledException("caller cancelled")),
                    CancellationToken.None);
            await cancelled.Should().ThrowAsync<OperationCanceledException>();
        }

        AgentResult result = new();
        AgentResult actual = await pipeline.ExecuteAsync(
            _ => ValueTask.FromResult(result), CancellationToken.None);
        actual.Should().BeSameAs(result);
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
