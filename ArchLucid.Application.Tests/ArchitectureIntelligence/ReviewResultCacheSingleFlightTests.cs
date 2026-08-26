using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReviewResultCacheSingleFlightTests
{
    [Fact]
    public async Task CoalesceAsync_concurrent_leaders_invoke_work_once()
    {
        int calls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        List<Task<ClosedLoopReasoningResult>> tasks = Enumerable.Range(0, 6)
            .Select(_ => Task.Run(async () =>
            {
                await startGate.Task;

                return await ReviewResultCacheSingleFlight.CoalesceAsync(
                    "closed-loop-flight-key",
                    async ct =>
                    {
                        Interlocked.Increment(ref calls);

                        await Task.Delay(40, ct);

                        return new ClosedLoopReasoningResult { RunId = "run-1" };
                    },
                    CancellationToken.None);
            }))
            .ToList();

        startGate.SetResult();
        ClosedLoopReasoningResult[] results = await Task.WhenAll(tasks);

        results.Should().OnlyContain(result => result.RunId == "run-1");
        calls.Should().Be(1);
    }

    [Fact]
    public async Task CoalesceAsync_leader_cancel_lets_waiters_retry_with_live_token()
    {
        int calls = 0;
        using CancellationTokenSource leaderToken = new();
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = Task.Run(async () =>
        {
            await startGate.Task;

            return await ReviewResultCacheSingleFlight.CoalesceAsync(
                "cancel-flight-key",
                async ct =>
                {
                    Interlocked.Increment(ref calls);

                    await Task.Delay(40, ct);

                    throw new OperationCanceledException(ct);
                },
                leaderToken.Token);
        });

        Task<ClosedLoopReasoningResult> waiter = Task.Run(async () =>
        {
            await startGate.Task;

            return await ReviewResultCacheSingleFlight.CoalesceAsync(
                "cancel-flight-key",
                async ct =>
                {
                    Interlocked.Increment(ref calls);

                    await Task.Yield();

                    return new ClosedLoopReasoningResult { RunId = "waiter-run" };
                },
                CancellationToken.None);
        });

        startGate.SetResult();
        leaderToken.CancelAfter(10);

        await leader.Should().ThrowAsync<OperationCanceledException>();

        ClosedLoopReasoningResult waiterResult = await waiter;
        waiterResult.RunId.Should().Be("waiter-run");
        calls.Should().Be(2);
    }
}
