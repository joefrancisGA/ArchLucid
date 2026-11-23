using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentHandlerFailureBudgetObserverTests
{
    private static readonly DateTimeOffset Epoch =
        new(2026, 11, 23, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Pre_handler_admission_rejection_does_not_consume_failure_budget_or_allocate_window()
    {
        AgentHandlerFailureBudgetObserver observer = new();

        AgentHandlerFailureBudgetSnapshot first = observer.Observe(
            "topology", AgentHandlerFailureBudgetOutcome.NotAdmitted, Epoch);
        first.Counted.Should().BeFalse();
        observer.TrackedDispatchKeys.Should().Be(0);

        for (int i = 0; i < AgentHandlerFailureBudgetObserver.MaxFailures; i++)
            observer.Observe("topology", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(i));

        AgentHandlerFailureBudgetSnapshot rejected = observer.Observe(
            "topology", AgentHandlerFailureBudgetOutcome.NotAdmitted, Epoch.AddSeconds(5));
        rejected.Counted.Should().BeFalse();
        rejected.NewlyExhausted.Should().BeFalse();
        rejected.Requests.Should().Be(5);
        rejected.Failures.Should().Be(5);

        AgentHandlerFailureBudgetSnapshot renewed = observer.Observe(
            "topology", AgentHandlerFailureBudgetOutcome.Success, Epoch.AddSeconds(60));
        renewed.Counted.Should().BeTrue();
        renewed.Requests.Should().Be(1);
        renewed.Failures.Should().Be(0);
    }

    [Fact]
    public void Five_failures_in_window_cross_reference_threshold_once_without_rejecting_work()
    {
        AgentHandlerFailureBudgetObserver observer = new();
        for (int i = 0; i < 4; i++)
        {
            AgentHandlerFailureBudgetSnapshot before = observer.Observe(
                "topology", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(i));
            before.Exhausted.Should().BeFalse();
            before.NewlyExhausted.Should().BeFalse();
        }

        AgentHandlerFailureBudgetSnapshot crossing = observer.Observe(
            "topology", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(4));

        crossing.Requests.Should().Be(5);
        crossing.Failures.Should().Be(5);
        crossing.Exhausted.Should().BeTrue();
        crossing.NewlyExhausted.Should().BeTrue();

        AgentHandlerFailureBudgetSnapshot later = observer.Observe(
            "topology", AgentHandlerFailureBudgetOutcome.Success, Epoch.AddSeconds(5));
        later.Counted.Should().BeTrue("the failure budget does not reject operations");
        later.Exhausted.Should().BeTrue();
        later.NewlyExhausted.Should().BeFalse();
        later.Requests.Should().Be(6);
        later.Failures.Should().Be(5);
    }

    [Fact]
    public void Successes_are_counted_as_requests_but_not_failures()
    {
        AgentHandlerFailureBudgetObserver observer = new();

        for (int i = 0; i < 5; i++)
            observer.Observe("cost", AgentHandlerFailureBudgetOutcome.Success, Epoch.AddSeconds(i));

        AgentHandlerFailureBudgetSnapshot after = observer.Observe(
            "cost", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(5));

        after.Requests.Should().Be(6);
        after.Failures.Should().Be(1);
        after.Exhausted.Should().BeFalse();
    }

    [Fact]
    public void Caller_cancellation_is_neutral_and_does_not_allocate_window()
    {
        AgentHandlerFailureBudgetObserver observer = new();

        AgentHandlerFailureBudgetSnapshot cancellation = observer.Observe(
            "critic", AgentHandlerFailureBudgetOutcome.CallerCancelled, Epoch);

        cancellation.Counted.Should().BeFalse();
        observer.TrackedDispatchKeys.Should().Be(0);

        AgentHandlerFailureBudgetSnapshot failure = observer.Observe(
            "critic", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(1));

        AgentHandlerFailureBudgetSnapshot repeatedCancellation = observer.Observe(
            "critic", AgentHandlerFailureBudgetOutcome.CallerCancelled, Epoch.AddSeconds(2));

        repeatedCancellation.Counted.Should().BeFalse();
        repeatedCancellation.Requests.Should().Be(1);
        repeatedCancellation.Failures.Should().Be(1);
        failure.NewlyExhausted.Should().BeFalse();
    }

    [Fact]
    public void Window_expires_at_sixty_seconds_and_clock_regression_starts_new_window()
    {
        AgentHandlerFailureBudgetObserver observer = new();

        for (int i = 0; i < 5; i++)
            observer.Observe("compliance", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(i));

        AgentHandlerFailureBudgetSnapshot reset = observer.Observe(
            "compliance", AgentHandlerFailureBudgetOutcome.Success, Epoch.AddSeconds(60));
        reset.Requests.Should().Be(1);
        reset.Failures.Should().Be(0);
        reset.Exhausted.Should().BeFalse();

        AgentHandlerFailureBudgetSnapshot backwardClock = observer.Observe(
            "compliance", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(30));
        backwardClock.Requests.Should().Be(1);
        backwardClock.Failures.Should().Be(1);
        backwardClock.Exhausted.Should().BeFalse();
    }

    [Fact]
    public async Task Parallel_observations_are_atomic_and_report_one_threshold_crossing()
    {
        AgentHandlerFailureBudgetObserver observer = new();

        AgentHandlerFailureBudgetSnapshot[] samples = await Task.WhenAll(
            Enumerable.Range(0, 100).Select(i => Task.Run(() => observer.Observe(
                "topology",
                i < 50 ? AgentHandlerFailureBudgetOutcome.Failure : AgentHandlerFailureBudgetOutcome.Success,
                Epoch))));

        samples.Count(s => s.NewlyExhausted).Should().Be(1);
        AgentHandlerFailureBudgetSnapshot final = observer.Observe(
            "topology", AgentHandlerFailureBudgetOutcome.CallerCancelled, Epoch);
        final.Requests.Should().Be(100);
        final.Failures.Should().Be(50);
        final.Exhausted.Should().BeTrue();
    }

    [Fact]
    public void Custom_dispatch_key_memory_is_bounded_and_case_insensitive()
    {
        AgentHandlerFailureBudgetObserver observer = new();

        observer.Observe("Custom-0", AgentHandlerFailureBudgetOutcome.Success, Epoch);
        observer.Observe("custom-0", AgentHandlerFailureBudgetOutcome.Success, Epoch.AddSeconds(1));
        observer.TrackedDispatchKeys.Should().Be(1);

        for (int i = 1; i <= AgentHandlerFailureBudgetObserver.MaxTrackedDispatchKeys; i++)
            observer.Observe($"custom-{i}", AgentHandlerFailureBudgetOutcome.Failure, Epoch.AddSeconds(i));

        observer.TrackedDispatchKeys.Should().Be(AgentHandlerFailureBudgetObserver.MaxTrackedDispatchKeys);
        // The oldest window was evicted: a fresh observation begins at one request.
        AgentHandlerFailureBudgetSnapshot reused = observer.Observe(
            "custom-0", AgentHandlerFailureBudgetOutcome.Success, Epoch.AddMinutes(2));
        reused.Requests.Should().Be(1);
        observer.TrackedDispatchKeys.Should().Be(AgentHandlerFailureBudgetObserver.MaxTrackedDispatchKeys);
    }
}
