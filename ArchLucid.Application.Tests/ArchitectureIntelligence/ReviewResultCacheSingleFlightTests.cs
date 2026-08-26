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
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "flight-hash" };
        int calls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        List<Task<ClosedLoopReasoningResult>> tasks = Enumerable.Range(0, 6)
            .Select(_ => Task.Run(async () =>
            {
                await startGate.Task;

                return await cache.CoalesceAsync(
                    manifest,
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
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "cancel-flight-hash" };
        int calls = 0;
        using CancellationTokenSource leaderToken = new();
        TaskCompletionSource leaderEntered = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = Task.Run(async () =>
        {
            return await cache.CoalesceAsync(
                manifest,
                async ct =>
                {
                    Interlocked.Increment(ref calls);
                    leaderEntered.TrySetResult();

                    await Task.Delay(Timeout.InfiniteTimeSpan, ct);

                    return new ClosedLoopReasoningResult { RunId = "leader" };
                },
                leaderToken.Token);
        });

        await leaderEntered.Task;

        Task<ClosedLoopReasoningResult> waiter = cache.CoalesceAsync(
            manifest,
            async _ =>
            {
                Interlocked.Increment(ref calls);

                return new ClosedLoopReasoningResult { RunId = "waiter-run" };
            },
            CancellationToken.None);

        await Task.Delay(20);
        leaderToken.Cancel();

        Func<Task> act = async () => await leader;
        await act.Should().ThrowAsync<OperationCanceledException>();

        ClosedLoopReasoningResult waiterResult = await waiter;
        waiterResult.RunId.Should().Be("waiter-run");
        calls.Should().Be(2);
    }

    [Fact]
    public async Task CoalesceAsync_retries_when_leader_abort_is_wrapped_in_aggregate_exception()
    {
        ReviewSingleFlightCoordinator coordinator = new();
        int calls = 0;
        using CancellationTokenSource leaderToken = new();
        TaskCompletionSource leaderEntered = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = Task.Run(async () =>
        {
            return await coordinator.CoalesceAsync(
                "wrapped-abort-key",
                async ct =>
                {
                    Interlocked.Increment(ref calls);
                    leaderEntered.TrySetResult();

                    await Task.Delay(Timeout.InfiniteTimeSpan, ct);

                    return new ClosedLoopReasoningResult { RunId = "leader" };
                },
                leaderToken.Token);
        });

        Task<ClosedLoopReasoningResult> waiter = Task.Run(async () =>
        {
            await leaderEntered.Task;

            return await coordinator.CoalesceAsync(
                "wrapped-abort-key",
                async _ =>
                {
                    Interlocked.Increment(ref calls);

                    await Task.Yield();

                    return new ClosedLoopReasoningResult { RunId = "retried" };
                },
                CancellationToken.None);
        });

        await leaderEntered.Task;
        leaderToken.Cancel();

        Func<Task> act = async () => await leader;
        await act.Should().ThrowAsync<OperationCanceledException>();

        ClosedLoopReasoningResult waiterResult = await waiter;
        waiterResult.RunId.Should().Be("retried");
        calls.Should().Be(2);
    }

    [Fact]
    public async Task CoalesceAsync_does_not_share_flight_across_publish_intent()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "publish-partition-hash" };
        int analysisCalls = 0;
        int publishCalls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> analysis = Task.Run(async () =>
        {
            await startGate.Task;

            return await cache.CoalesceAsync(
                manifest,
                async ct =>
                {
                    Interlocked.Increment(ref analysisCalls);

                    await Task.Delay(40, ct);

                    return new ClosedLoopReasoningResult { RunId = "analysis" };
                },
                CancellationToken.None,
                publishToProduct: false);
        });

        Task<ClosedLoopReasoningResult> publish = Task.Run(async () =>
        {
            await startGate.Task;

            return await cache.CoalesceAsync(
                manifest,
                async ct =>
                {
                    Interlocked.Increment(ref publishCalls);

                    await Task.Delay(40, ct);

                    return new ClosedLoopReasoningResult { RunId = "publish" };
                },
                CancellationToken.None,
                publishToProduct: true);
        });

        startGate.SetResult();
        ClosedLoopReasoningResult[] results = await Task.WhenAll(analysis, publish);

        results.Select(result => result.RunId).Should().BeEquivalentTo(["analysis", "publish"]);
        analysisCalls.Should().Be(1);
        publishCalls.Should().Be(1);
    }

    [Fact]
    public async Task CoalesceAsync_leader_and_waiter_results_are_isolated()
    {
        ReviewSingleFlightCoordinator coordinator = new();
        TaskCompletionSource leaderCanFinish = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = coordinator.CoalesceAsync(
            "isolation-key",
            async cancellationToken =>
            {
                await leaderCanFinish.Task.WaitAsync(cancellationToken);

                return new ClosedLoopReasoningResult { RunId = "leader-run" };
            },
            CancellationToken.None);

        await Task.Delay(50);

        Task<ClosedLoopReasoningResult> waiter = coordinator.CoalesceAsync(
            "isolation-key",
            _ => Task.FromException<ClosedLoopReasoningResult>(new InvalidOperationException("not leader")),
            CancellationToken.None);

        leaderCanFinish.SetResult();

        ClosedLoopReasoningResult leaderResult = await leader;
        ClosedLoopReasoningResult waiterResult = await waiter;

        leaderResult.RunId = "mutated-leader";
        waiterResult.RunId.Should().Be("leader-run");
    }

    [Fact]
    public async Task CoalesceAsync_analysis_follower_strips_publish_block_from_blocked_leader()
    {
        ReviewSingleFlightCoordinator coordinator = new();
        TaskCompletionSource leaderCanFinish = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = coordinator.CoalesceAsync(
            "blocked-leader-key",
            async cancellationToken =>
            {
                await leaderCanFinish.Task.WaitAsync(cancellationToken);

                return new ClosedLoopReasoningResult
                {
                    RunId = "leader-run",
                    PublishBlocked = true,
                    PublishBlockReasons = ["MustNotFailClass: blocked"],
                    ReviewCompleteBlocked = true,
                };
            },
            CancellationToken.None);

        await Task.Delay(50);

        Task<ClosedLoopReasoningResult> waiter = coordinator.CoalesceAsync(
            "blocked-leader-key",
            _ => Task.FromException<ClosedLoopReasoningResult>(new InvalidOperationException("not leader")),
            CancellationToken.None,
            stripCoalescedFollowerPublishLeaks: true);

        leaderCanFinish.SetResult();

        ClosedLoopReasoningResult leaderResult = await leader;
        ClosedLoopReasoningResult waiterResult = await waiter;

        leaderResult.PublishBlocked.Should().BeTrue();
        leaderResult.ReviewCompleteBlocked.Should().BeTrue();
        waiterResult.PublishBlocked.Should().BeFalse();
        waiterResult.ReviewCompleteBlocked.Should().BeFalse();
    }

    [Fact]
    public async Task CoalesceAsync_analysis_follower_of_published_leader_keeps_analysis_truth()
    {
        ReviewSingleFlightCoordinator coordinator = new();
        TaskCompletionSource leaderCanFinish = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = coordinator.CoalesceAsync(
            "published-leader-key",
            async cancellationToken =>
            {
                await leaderCanFinish.Task.WaitAsync(cancellationToken);

                return new ClosedLoopReasoningResult
                {
                    RunId = "leader-run",
                    PublishedToProduct = true,
                    ReviewCompleteBlocked = true,
                    IntegrityPassedFindingIds = ["finding-1"],
                };
            },
            CancellationToken.None);

        await Task.Delay(50);

        Task<ClosedLoopReasoningResult> waiter = coordinator.CoalesceAsync(
            "published-leader-key",
            _ => Task.FromException<ClosedLoopReasoningResult>(new InvalidOperationException("not leader")),
            CancellationToken.None,
            stripCoalescedFollowerPublishLeaks: true);

        leaderCanFinish.SetResult();

        ClosedLoopReasoningResult waiterResult = await waiter;

        waiterResult.PublishedToProduct.Should().BeTrue();
        waiterResult.ReviewCompleteBlocked.Should().BeTrue();
        waiterResult.IntegrityPassedFindingIds.Should().Contain("finding-1");
    }
}
