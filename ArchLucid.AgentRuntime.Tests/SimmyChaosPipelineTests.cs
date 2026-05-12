using System.Diagnostics;

using ArchLucid.Persistence.Connections;
using ArchLucid.TestSupport;

using FluentAssertions;

using Polly;
using Polly.Retry;
using Polly.Simmy;
using Polly.Simmy.Fault;
using Polly.Timeout;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Polly Simmy chaos strategies layered with retries / timeouts â€” mirrors production resilience patterns without
///     external services.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SimmyChaosPipelineTests
{
    [SkippableFact]
    public async Task Timeout_rejects_slow_delegate_quickly()
    {
        // Polly v8 timeout is optimistic (cooperative cancellation). On busy Linux CI hosts, a fixed
        // short delay can finish before the timeout pipeline schedules cancellation — the delegate then
        // returns successfully and the test flakes. An infinite wait relies only on ct cancellation.
        ResiliencePipeline<string> pipeline = new ResiliencePipelineBuilder<string>()
            .AddTimeout(TimeSpan.FromMilliseconds(80))
            .Build();

        Func<Task> act = async () =>
            await pipeline.ExecuteAsync(
                static async ct =>
                {
                    await Task.Delay(Timeout.InfiniteTimeSpan, ct);

                    return "ok";
                },
                CancellationToken.None);

        await act.Should().ThrowAsync<TimeoutRejectedException>();
    }

    [SkippableFact]
    public async Task ChaosLatency_at_full_injection_adds_delay_before_completion()
    {
        ResiliencePipeline<string> pipeline = new ResiliencePipelineBuilder<string>()
            .AddChaosLatency(1.0, TimeSpan.FromMilliseconds(120))
            .Build();

        Stopwatch sw = Stopwatch.StartNew();

        _ = await pipeline.ExecuteAsync(static async _ =>
        {
            await Task.CompletedTask;
            return "ok";
        }, CancellationToken.None);

        sw.Stop();

        // Simmy injects latency around the callback; budget is generous for loaded CI agents.
        sw.ElapsedMilliseconds.Should().BeGreaterThanOrEqualTo(90);
    }

    [SkippableFact]
    public async Task ChaosFault_transient_sql_retries_then_invokes_delegate_once()
    {
        int innerCalls = 0;
        int chaosWave = 0;

        ChaosFaultStrategyOptions chaosOptions = new()
        {
            InjectionRate = 1.0,
            EnabledGenerator = _ => new ValueTask<bool>(Interlocked.Increment(ref chaosWave) <= 2),
            FaultGenerator = static _ => new ValueTask<Exception?>(SqlExceptionTestFactory.Create(40613))
        };

        ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
            .AddRetry(
                new RetryStrategyOptions
                {
                    MaxRetryAttempts = 4,
                    Delay = TimeSpan.FromMilliseconds(1),
                    ShouldHandle = new PredicateBuilder().Handle<Exception>(SqlTransientDetector.IsTransient)
                })
            .AddChaosFault(chaosOptions)
            .Build();

        await pipeline.ExecuteAsync(
            async _ =>
            {
                Interlocked.Increment(ref innerCalls);
                await Task.CompletedTask;
            },
            CancellationToken.None);

        innerCalls.Should().Be(1);
        chaosWave.Should().Be(3);
    }
}
