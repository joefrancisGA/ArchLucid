using ArchLucid.Application.Analysis;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Resilience;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AnalysisExecutionBudgetTests
{
    [Fact]
    public async Task Late_stage_result_is_rejected_and_no_later_stage_starts_after_the_run_deadline()
    {
        FakeTimeProvider clock = new();
        using AnalysisExecutionBudget budget = new(new AnalysisStageExecutionOptions(), clock,
            TimeSpan.FromSeconds(5), CancellationToken.None);
        List<AnalysisStageObservation> outcomes = [];

        await budget.ExecuteAsync("first", _ =>
        {
            clock.Advance(TimeSpan.FromSeconds(3));

            return Task.CompletedTask;
        }, budget.Token, outcomes.Add);

        AnalysisStageExecutionException timedOut = await Assert.ThrowsAsync<AnalysisStageExecutionException>(() =>
            budget.ExecuteAsync("late", _ =>
            {
                clock.Advance(TimeSpan.FromSeconds(2));

                return Task.CompletedTask;
            }, budget.Token, outcomes.Add));

        await Assert.ThrowsAsync<AnalysisStageExecutionException>(() =>
            budget.ExecuteAsync("blocked", _ => throw new InvalidOperationException("Must not run."),
                budget.Token, outcomes.Add));

        Assert.Equal(AnalysisStageOutcome.TimedOut, timedOut.Outcome);
        Assert.Equal([AnalysisStageOutcome.Succeeded, AnalysisStageOutcome.TimedOut, AnalysisStageOutcome.NotStarted],
            outcomes.Select(outcome => outcome.Status).ToArray());
        Assert.Equal([1, 1, 0], outcomes.Select(outcome => outcome.Attempts).ToArray());
    }

    [Fact]
    public async Task Caller_cancellation_remains_cancellation_when_the_stage_timer_also_fires()
    {
        FakeTimeProvider clock = new();
        using CancellationTokenSource caller = new();
        using AnalysisExecutionBudget budget = new(new AnalysisStageExecutionOptions(), clock,
            TimeSpan.FromSeconds(1), caller.Token);
        AnalysisStageObservation? observed = null;

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            budget.ExecuteAsync("stage", token =>
            {
                clock.Advance(TimeSpan.FromSeconds(1));
                caller.Cancel();
                token.ThrowIfCancellationRequested();

                return Task.CompletedTask;
            }, budget.Token, value => observed = value));

        Assert.Equal(AnalysisStageOutcome.Canceled, observed?.Status);
    }

    [Fact]
    public async Task Replay_safe_read_waits_for_server_minimum_then_exhausts_its_attempt_budget()
    {
        FakeTimeProvider clock = new();
        AnalysisStageExecutionOptions options = new() { ReadMaxAttempts = 2, ReadInitialDelayMilliseconds = 250 };
        using AnalysisExecutionBudget budget = new(options, clock, TimeSpan.FromSeconds(20), CancellationToken.None);
        int invocations = 0;

        Task<int> work = budget.ExecuteAsync<int>("read", _ =>
        {
            invocations++;

            return Task.FromException<int>(new ReplaySafeAnalysisReadException(
                new InvalidOperationException("Throttled."), TimeSpan.FromSeconds(3)));
        }, budget.Token, retrySafeRead: SafeRead);

        clock.Advance(TimeSpan.FromMilliseconds(2999));
        Assert.Equal(1, invocations);
        Assert.False(work.IsCompleted);
        clock.Advance(TimeSpan.FromMilliseconds(1));

        AnalysisStageExecutionException failure = await Assert.ThrowsAsync<AnalysisStageExecutionException>(() => work);
        Assert.Equal(2, invocations);
        Assert.Equal(AnalysisStageOutcome.RetryExhausted, failure.Outcome);
    }

    [Fact]
    public async Task Retry_is_not_scheduled_if_server_minimum_would_consume_remaining_stage_budget()
    {
        FakeTimeProvider clock = new();
        AnalysisStageExecutionOptions options = new() { StageTimeoutSeconds = { ["read"] = 2 } };
        using AnalysisExecutionBudget budget = new(options, clock, TimeSpan.FromSeconds(30), CancellationToken.None);
        AnalysisStageObservation? observed = null;

        AnalysisStageExecutionException failure = await Assert.ThrowsAsync<AnalysisStageExecutionException>(() =>
            budget.ExecuteAsync("read", _ => Task.FromException<int>(new ReplaySafeAnalysisReadException(
                    new InvalidOperationException("Throttled."), TimeSpan.FromSeconds(2))),
                budget.Token, retrySafeRead: SafeRead, observe: outcome => observed = outcome));

        Assert.Equal(AnalysisStageOutcome.TimedOut, failure.Outcome);
        Assert.Equal(1, observed?.Attempts);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task A_permanent_fault_or_a_stage_that_did_not_opt_in_is_never_replayed(bool optIn)
    {
        InvalidOperationException permanent = new("Permanent provider error.");
        Exception expected = optIn ? permanent : new ReplaySafeAnalysisReadException(permanent);
        using AnalysisExecutionBudget budget = new(new AnalysisStageExecutionOptions(), new FakeTimeProvider(),
            TimeSpan.FromSeconds(30), CancellationToken.None);
        AnalysisStageObservation? observed = null;

        Exception? failure = await Record.ExceptionAsync(() => budget.ExecuteAsync(
            "stage", _ => Task.FromException<int>(expected), budget.Token,
            retrySafeRead: optIn ? SafeRead : null, observe: outcome => observed = outcome));

        Assert.Same(expected, failure);
        Assert.Equal(1, observed?.Attempts);
        Assert.Equal(AnalysisStageOutcome.Failed, observed?.Status);
    }

    private static AnalysisReadRetrySignal? SafeRead(Exception ex) =>
        ex is ReplaySafeAnalysisReadException retry ? new AnalysisReadRetrySignal(retry.RetryAfter) : null;
}
