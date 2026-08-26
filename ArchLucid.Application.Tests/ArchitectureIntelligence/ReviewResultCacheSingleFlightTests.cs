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
}
